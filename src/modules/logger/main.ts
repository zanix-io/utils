import type {
  BaseFormattedLog,
  BaseMethods,
  Console,
  ConsoleInfo,
  ConsoleMethodFor,
  DefaultFormattedLog,
  DefaultResponse,
  Formatter,
  LoggerData,
  LoggerFileOptions,
  LoggerFunctionOptions,
  LoggerLevel,
  LoggerMethods,
  LoggerOptions,
  LoggerTimer,
  LoggerTimerLevel,
  LoggerTimerOptions,
  SaveDataFile,
  SaveDataFunction,
} from 'typings/logger.ts'
import type { TaskCallback, TaskCallbackResponse } from 'typings/workers.ts'

import { serializeMultipleErrors } from 'modules/errors/serialize.ts'
import { createRedactor } from 'modules/errors/redact.ts'
import { baseFormatter } from 'modules/logger/defaults/formatter.ts'
import { setGlobalZnx } from 'modules/helpers/zanix/namespace.ts'
import { defaultClock, formatDuration, roundDuration, startTimer } from 'utils/timing.ts'
import { baseSaveData, saveDataFetcherFunction } from './defaults/storage/main.ts'
import { showMessage } from './base.ts'
import {
  DEFAULT_LOGGER_LEVEL,
  isMethodAtLevel,
  levelRank,
  parseLoggerLevel,
  resolveLoggerLevel,
} from './level.ts'

/**
 * Resolves a `SaveDataFile` config object (`LoggerFileOptions`'s own `storage.save` shape) into
 * a real, file-backed `SaveDataFunction` — the same role `defaults/storage/default.ts`'s own
 * `saveDataFileFunction` plays, injected here rather than imported directly so THIS file never
 * statically (or dynamically — see {@linkcode registerFileSaveFactory}'s own doc) pulls in
 * `WorkerManager`.
 */
export type FileSaveFactory = (options: SaveDataFile) => SaveDataFunction

let fileSaveFactory: FileSaveFactory | undefined

/**
 * Registers the real file-based `FileSaveFactory` — called once, as a module-load side effect,
 * by `mod.ts` (the only file in this module allowed to import `defaults/storage/default.ts`'s
 * `saveDataFileFunction`/`WorkerManager`). This is what lets `Logger`'s own constructor keep its
 * existing "just import and use it, defaults to a file" behavior for every real server consumer —
 * anyone importing `Logger` via `@zanix/logger` always loads `mod.ts` first, so this has always
 * run by the time they construct one — without THIS file ever needing to import anything
 * Worker-related itself.
 *
 * Confirmed empirically why that constraint is real, not speculative caution: even an unreachable
 * dynamic `import()` of `defaults/storage/default.ts`, present anywhere in a file this one's own
 * import graph touches — including inside a function nothing calls — still makes a real Vite
 * build fail once the referenced module is JSR-hosted, regardless of runtime reachability. A
 * browser client that only ever imports THIS file directly (via `createClientLogger`, never
 * through `mod.ts`) never calls this registration function, so `fileSaveFactory` stays
 * `undefined` there, and a non-function `storage.save` safely resolves to a no-op instead — see
 * `createClientLogger`'s own doc.
 * @param factory - `defaults/storage/default.ts`'s own `saveDataFileFunction`.
 */
export function registerFileSaveFactory(factory: FileSaveFactory): void {
  fileSaveFactory = factory
}

/**
 * Builds a browser-safe `Logger` — `storage.save` MUST be a real function (the `fetcher` given
 * here, wrapped via `saveDataFetcherFunction`), never the `SaveDataFile` config-object shape
 * `LoggerFileOptions` also accepts (this file never has a `FileSaveFactory` registered in a
 * browser — see {@linkcode registerFileSaveFactory}'s own doc). This is what actually keeps a
 * browser client bundle (`@zanix/space`'s own client barrel, for one) from ever reaching
 * `defaults/storage/default.ts`'s `WorkerManager`/`Deno.readTextFile` — not a separate class, not
 * a separate entrypoint, just never calling anything that imports that file.
 *
 * Defaults to `disableGlobalAssign: true` — a browser client instance has no reason to own
 * `globalThis.logger`/`Znx.logger` in its own (browser) realm by default, since every real
 * consumer imports it directly rather than reaching for a global. This isn't what keeps it from
 * clobbering a server's own default `Logger` instance (a browser tab's `globalThis` and a server
 * process's `globalThis` are already different realms entirely, so that was never at risk) — it's
 * purely about not leaving an unused global assigned in the browser for no reason. Pass
 * `disableGlobalAssign: false` to opt back in — e.g. for a `window.logger`-style debugging
 * convenience in a dev build — rather than wiring the global assignment by hand.
 * @param fetcher - Receives one already-formatted log entry per call — never `JSON.stringify`'d
 * on its behalf, so it decides whether/how to serialize it — and sends it somewhere, typically a
 * `fetch()` to this app's own backend endpoint (e.g. `@zanix/space`'s `/api/log`), which relays
 * it into the server's own `Logger` via `Logger#ingest`.
 * @param options - Just `disableGlobalAssign` and the minimum `level` (default `'debug'`: every
 * entry is handled; a browser has no `LOG_LEVEL`) — a plain, standalone shape rather than
 * `Pick<LoggerFunctionOptions<...>, 'disableGlobalAssign'>`, deliberately: everything else about
 * the underlying `Logger` (storage, formatting) is fixed by this function's own contract, so no
 * other `LoggerFunctionOptions` field belongs here, and reusing that type would pull its own
 * unrelated `storage`/`redact` fields into this signature for no reason.
 */
export function createClientLogger(
  fetcher: <T extends BaseFormattedLog = DefaultFormattedLog>(fmtLog: T) => void | Promise<void>,
  options: { disableGlobalAssign?: boolean; level?: LoggerLevel } = {},
): Logger {
  const { disableGlobalAssign = true, level = DEFAULT_LOGGER_LEVEL } = options
  return new Logger<DefaultResponse>({
    disableGlobalAssign,
    // A browser has no environment: the level is the one given here, never `LOG_LEVEL`.
    level,
    storage: { save: saveDataFetcherFunction(fetcher) },
  })
}

/**
 * The internal `Logger` base class. Extended by the default `Logger` export
 * of `@zanix/utils/logger` to make the class nameable in generated docs.
 */
export class Logger<Return extends unknown = DefaultResponse> {
  #formatter: Formatter = () => ({})
  #saveFuntion: SaveDataFunction = () => {}
  #redact: ReturnType<typeof createRedactor>
  #level: LoggerLevel = DEFAULT_LOGGER_LEVEL
  #minimumRank = levelRank(DEFAULT_LOGGER_LEVEL)

  /**
   * Creates a `Logger` instance with a function-based save mode.
   * @param options Configuration options for the Logger class with a function-based save mode.
   */
  constructor(options?: LoggerFunctionOptions<Return>)
  /**
   * Creates a `Logger` instance with file-based save mode.
   * @param options Configuration options for the Logger class with file-based save mode.
   */
  constructor(options?: LoggerFileOptions<Return>)
  constructor(options: LoggerOptions<Return> = {}) {
    const { storage, disableGlobalAssign, redact, level } = options
    const globals: Partial<typeof Znx> = {}

    // Assign the logger globally before instance creation unless disabled.
    // Skipped if disableGlobalAssign is true.
    if (!disableGlobalAssign) {
      globals.logger = this
      Object.assign(globalThis, { logger: globals.logger })
    }

    // Initialize global configuration for Znx.
    // This ensures Znx's `baseSaveData` method has the necessary global configuration.
    setGlobalZnx(globals)

    this.#redact = createRedactor(redact)
    this.setLevel(resolveLoggerLevel(level))

    if (storage !== false) {
      const { save, formatter } = storage ?? {}
      this.#formatter = baseFormatter(formatter, this.#redact)

      // Whether the caller gave `storage.save` at all — a real function, OR a `SaveDataFile`
      // config object, either counts (matches `saveDataFileFunction({})`'s own "no options"
      // shape below) — as opposed to omitting `storage`/`storage.save` entirely and relying on
      // the fully-automatic file default. `baseSaveData` needs this explicitly: once resolved
      // into a plain `SaveDataFunction` below, it can no longer tell an explicit file config
      // apart from the automatic default that also happens to go through
      // `fileSaveFactory` — see its own doc for why that distinction still matters.
      const explicitSave = save !== undefined
      const saveFn = typeof save === 'function'
        ? save
        : fileSaveFactory?.({ ...save }) ?? (() => undefined)

      this.#saveFuntion = baseSaveData(saveFn, explicitSave, this.#redact)
    }
  }

  /**
   * The minimum level this logger handles: `'debug'` (everything, the default), `'info'`, `'warn'`,
   * `'high'`, `'error'` or `'silent'` (nothing). Set by the `level` option, else by the `LOG_LEVEL`
   * environment variable, and changed with {@linkcode setLevel}.
   */
  public getLevel(): LoggerLevel {
    return this.#level
  }

  /**
   * Changes the minimum level at run time. From the next call on, an entry below it is neither
   * printed nor persisted, in this instance only. A value that is not a level is reported once and
   * leaves the current level as it is.
   * @param level - `'debug'`, `'info'`, `'warn'`, `'high'`, `'error'` or `'silent'`.
   */
  public setLevel(level: LoggerLevel): void {
    const parsed = parseLoggerLevel(level, 'setLevel')
    if (!parsed) return
    this.#level = parsed
    this.#minimumRank = levelRank(parsed)
  }

  /**
   * Whether an entry of `level` is printed and persisted by this logger, so costly arguments can
   * be built only when they will be used:
   *
   * ```ts
   * if (logger.isLevelEnabled('debug')) logger.debug('state', buildExpensiveSnapshot())
   * ```
   *
   * `'success'` ranks with `'info'`. Whether the entry is persisted also depends on the method
   * (`debug` and `success` never are) and on the storage; this only answers whether it is handled.
   * @param level - The method to ask about.
   */
  public isLevelEnabled(level: LoggerMethods): boolean {
    return isMethodAtLevel(level, this.#minimumRank)
  }

  /**
   * Persists a log entry that originated elsewhere (e.g. a browser client's own
   * `@zanix/utils/logger/client` instance, relayed through an HTTP endpoint like
   * `@zanix/space`'s `/api/log`) through this instance's OWN configured save function. Redacts
   * and formats the raw data given exactly as `warn`/`error`/etc. would — a relayed remote log is
   * exactly the kind of thing worth persisting through this instance's own configured backend
   * (Elasticsearch included). Unlike `debug`/`success`, `ingest` never appends `'noSave'` itself,
   * so it always attempts to persist by default — but it doesn't strip the sentinel either: if the
   * remote origin's own raw `data` genuinely ends with the literal string `'noSave'`, that's still
   * honored the exact same way a local call's own trailing `'noSave'` would be (see `#log`'s own
   * doc for why `origin`, kept entirely separate from `data`, never interferes with that
   * detection). Deliberately skips `showMessage`'s console print, unlike every other log method:
   * the remote origin already surfaced this entry through its own console (or its own UI) —
   * printing it again here would misrepresent a relayed remote event as if it were a genuine local
   * one on THIS process's own console. Not part of the everyday debug/info/warn/error/high API; a
   * relay endpoint's own use only.
   * @param type - The severity the remote origin itself logged at.
   * @param origin - Where the relayed entry actually came from — merged onto the persisted log as
   * a top-level `origin` field (see {@linkcode DefaultFormattedLog.origin}), sibling to
   * `timestamp`/`level`/etc., not buried inside `data` — so a stored/queried log can be filtered
   * or aggregated by origin directly. Defaults to `'client'`: `ingest`'s only real use is relaying
   * an entry a BROWSER client's own `createClientLogger` instance already logged (see this
   * method's own doc above) — pass an explicit value for a non-browser origin relaying through
   * the same endpoint (another service, a mobile app, ...).
   * @param data - The remote origin's own raw, unformatted log data — this instance's own
   * `redact`/`formatter` still run on it here, exactly as they would for a local call.
   */
  public ingest(
    type: LoggerMethods,
    origin: string = 'client',
    ...data: LoggerData
  ): Return | undefined {
    return this.#log(type, false, origin, ...data)
  }

  /**
   * Redacts `data` exactly once — the single result is reused for both `showMessage` (console) and
   * `#storage` (file/custom `storage.save` — Elasticsearch included), rather than each redacting
   * its own copy of the same raw input. `showMessage` itself never redacts (see its own doc), so
   * this is the only place that does for this call.
   * @param print - Whether to run `showMessage`'s console print at all — every public method
   * passes `true` except {@linkcode ingest}, which never does (see its own doc for why).
   * @param origin - Forwarded to `#storage` as a top-level `origin` field on the PERSISTED
   * formatted log only — never reaches `showMessage`'s console print, regardless of `print`,
   * since `origin` is merged in inside `#storage`'s own closure, downstream of the
   * `showMessage(type, ...redactedData)` call above. Only {@linkcode ingest} passes one; every
   * other method passes `undefined`. Kept OUT of `data` entirely (not appended/redacted alongside
   * it), so a caller's own genuine trailing `'noSave'` sentinel (the last element of `data`
   * itself) is still exactly what gets checked below — nothing about `origin` can ever displace it
   * from that position.
   */
  #log(
    type: LoggerMethods,
    print: boolean,
    origin: string | undefined,
    ...data: LoggerData
  ): Return | undefined {
    // Below the minimum level: nothing is redacted, printed or persisted.
    if (!this.isLevelEnabled(type)) return undefined

    const hasNoSave = data[data.length - 1] === 'noSave'
    if (hasNoSave) data.length = data.length - 1

    const redactedData = data.map(this.#redact) as LoggerData
    if (print) showMessage(type, ...redactedData)
    if (hasNoSave) return undefined

    return this.#storage(type, redactedData, origin) as Return
  }

  #storage(type: LoggerMethods, log: LoggerData, origin?: string) {
    return this.#saveFuntion({
      getFmtLog: <T>() => {
        const formatted = this.#formatter(type, log)
        return (origin ? { ...formatted, origin } : formatted) as T
      },
    })
  }

  /**
   * Logs a debug message along with additional parameters.
   * @param data - Values to be printed to the console.
   */
  public debug(...data: LoggerData<'debug'>): Return | undefined {
    return this.#log('debug', true, undefined, ...data, 'noSave')
  }

  /**
   * Logs an error message with additional parameters.
   * @param data - Values to be printed to the console.
   */
  public error(...data: LoggerData<'error'>): Return | undefined {
    // Checked first: an error that is not handled is not marked as logged, so a logger with a lower
    // level can still log it.
    if (!this.isLevelEnabled('error')) return

    const [message, ...rest] = data
    // `redact: false` — this only needs to flatten each `Error` into a plain, serializable shape
    // and dedupe already-logged instances. `#log` redacts the result (using this instance's own
    // `redact` option) right after, so redacting here too would just walk the same data twice.
    const errors = serializeMultipleErrors(rest, { redact: false })

    if (!errors.length && rest.length) return
    return this.#log('error', true, undefined, message, ...errors)
  }

  /**
   * Logs a info message with additional parameters.
   * @param data - Values to be printed to the console.
   */
  public info(...data: LoggerData<'info'>): Return | undefined {
    return this.#log('info', true, undefined, ...data)
  }

  /**
   * Logs a success message
   * @param data - The primary message.
   */
  public success(message: LoggerData<'success'>): Return | undefined {
    return this.#log('success', true, undefined, message, 'noSave')
  }

  /**
   * Logs a warning message with additional parameters.
   * @param data - Values to be printed to the console.
   */
  public warn(...data: LoggerData<'warn'>): Return | undefined {
    return this.#log('warn', true, undefined, ...data)
  }

  /**
   * Logs a high-severity message with additional parameters — an anomalous condition that
   * deserves attention sooner than a routine {@linkcode warn}, but where the operation itself
   * didn't necessarily fail outright (unlike {@linkcode error}). Persisted by default, same as
   * `warn`/`error`. Does not perform `error`'s own already-logged (`_logged`) dedup — pass an
   * `Error` here the same way you would to `warn`, as plain extra data, not as something this
   * method serializes/dedups on your behalf.
   * @param data - Values to be printed to the console.
   */
  public high(...data: LoggerData<'high'>): Return | undefined {
    return this.#log('high', true, undefined, ...data)
  }

  /**
   * Starts measuring how long something takes and returns the timer to stop it. Stopping logs one
   * entry with the label, the duration and a status, so a log shows where time went:
   *
   * ```ts
   * const timer = logger.timer('profile.load', { metadata: { userId } })
   * const profile = await loadProfile(userId)
   * timer.stop() // 🟣 ... profile.load took 12.3ms { userId, label, durationMs: 12.3, status: 'ok' }
   * ```
   *
   * The entry's message is `<label> took <duration>` (`12.3ms`, `1.25s`) and its data carries the
   * stable, queryable fields `label`, `durationMs` (a number of milliseconds, two decimals) and
   * `status` (`'ok'`). It goes through the same redaction, formatting and storage as every other
   * log, so `metadata` is redacted by key, and `label` must be a fixed string (a route pattern, an
   * operation name), never one built from user input or a secret.
   *
   * By default the entry is logged at `'debug'`: printed, never persisted. Pass `level` to keep it,
   * or `slowThresholdMs` to log only the slow ones (then at `'warn'` unless `level` says otherwise).
   * The clock is monotonic (`performance.now()`), so it never jumps with the system time. A timer
   * is cheap — two clock readings and a closure — and an entry below `slowThresholdMs` costs no
   * more than that.
   *
   * A timer logs once: stopping it again returns the same duration. It also implements
   * `Symbol.dispose`, so `using timer = logger.timer('x')` logs when the scope ends, including by
   * an exception (then logged as a normal measurement; use {@linkcode time} to record the failure).
   * Logging never throws into the measured code.
   * @param label - A fixed name for what is measured.
   * @param options - Level, slow threshold, persistence, extra fields and clock.
   */
  public timer(label: string, options: LoggerTimerOptions = {}): LoggerTimer {
    // A timer returns the duration, so it keeps reading the clock; when the entry could never be
    // logged (see `time`) it only skips building and logging it.
    if (!this.#timingMayLog(options)) {
      const elapsed = startTimer(options.clock ?? defaultClock)
      let duration: number | undefined
      return {
        elapsed,
        stop: () => duration ??= roundDuration(elapsed()),
        [Symbol.dispose]: () => {},
      }
    }

    const { elapsed, finish } = this.#startTimer(label, options)

    return {
      elapsed,
      stop: (metadata) => finish(metadata),
      [Symbol.dispose]: () => void finish(),
    }
  }

  /**
   * Runs `fn`, measures how long it takes and logs the measurement — {@linkcode timer} around one
   * call. A synchronous function stays synchronous; one returning a promise gives back a promise
   * that settles the same way, with the duration covering the whole wait. The return value is the
   * function's own.
   *
   * If `fn` throws or its promise rejects, the measurement is logged with `status: 'error'` plus
   * `errorName` (and `errorCode` when the error has a string `code`), at least at `'warn'`, and the
   * original error is rethrown untouched: it is not wrapped, not logged here and not marked as
   * logged, so the caller's own error handling behaves exactly as without the timing. The error's
   * message is deliberately not recorded — it can carry data that does not belong in a timing log.
   * Failing to log never replaces the function's own result or error.
   *
   * The logger's minimum level applies. When neither the entry's level nor `'warn'` (the level a
   * failure is raised to) is enabled, `time` takes a fast path and only runs `fn`: no clock is
   * read and no entry is built. When only the entry's own level is disabled (`LOG_LEVEL=info` and
   * the default `'debug'` level, say), the function is still measured so that a failure can be
   * logged at `'warn'` with its duration; a successful run is dropped before anything is built.
   * @param label - A fixed name for what is measured.
   * @param fn - The function to run.
   * @param options - Level, slow threshold, persistence, extra fields and clock.
   * @example
   * ```ts
   * const user = await logger.time('users.find', () => users.find(id), { slowThresholdMs: 200 })
   * ```
   */
  public time<T>(label: string, fn: () => T, options: LoggerTimerOptions = {}): T {
    // The measurement could never be logged at the current level: no clock, no closures, no
    // metadata work, only the function itself.
    if (!this.#timingMayLog(options)) return fn()

    const { finish } = this.#startTimer(label, options)

    let result: T
    try {
      result = fn()
    } catch (error) {
      finish(undefined, { error })
      throw error
    }

    if (isThenable(result)) {
      return result.then(
        (value) => {
          finish()
          return value
        },
        (error: unknown) => {
          finish(undefined, { error })
          throw error
        },
      ) as T
    }

    finish()
    return result
  }

  /**
   * The level a measurement is logged at when it succeeds: the given one, else `'warn'` with a
   * slow threshold, else `'debug'`.
   */
  #timingLevel(options: LoggerTimerOptions): LoggerTimerLevel {
    return options.level ?? (hasSlowThreshold(options.slowThresholdMs) ? 'warn' : 'debug')
  }

  /**
   * Whether a measurement could be logged at all at the current level: its own level is enabled,
   * or it fails and is raised to `'warn'` (a failure never stays below it). When it cannot, the
   * measurement is not worth starting.
   */
  #timingMayLog(options: LoggerTimerOptions): boolean {
    const level = this.#timingLevel(options)
    const failureLevel = level === 'debug' || level === 'info' ? 'warn' : level
    return this.isLevelEnabled(level) || this.isLevelEnabled(failureLevel)
  }

  /**
   * Starts the stopwatch behind {@linkcode timer} and {@linkcode time}: `finish` stops it, logs the
   * entry once and returns the duration. It never throws — a failing formatter, save function or
   * redactor must not replace the measured code's own result or error — and a promise a custom save
   * function returns is observed, so a rejection there is not an unhandled one.
   */
  #startTimer(label: string, options: LoggerTimerOptions) {
    const elapsed = startTimer(options.clock ?? defaultClock)
    let duration: number | undefined

    const finish = (extra?: Record<string, unknown>, failure?: { error: unknown }): number => {
      if (duration !== undefined) return duration
      const exact = elapsed()
      duration = roundDuration(exact)

      try {
        const saved = this.#logDuration(label, duration, exact, options, extra, failure)
        if (isThenable(saved)) saved.then(undefined, () => {})
      } catch { /** Logging a measurement must never break the measured code. */ }

      return duration
    }

    return { elapsed, finish }
  }

  /**
   * Builds and logs one duration entry, or does nothing when it is below the slow threshold.
   * `durationMs` is the rounded value that is stored and compared with the threshold; `exact` is
   * the unrounded one the message is formatted from, so a value is not rounded twice.
   */
  #logDuration(
    label: string,
    durationMs: number,
    exact: number,
    options: LoggerTimerOptions,
    extra: Record<string, unknown> | undefined,
    failure: { error: unknown } | undefined,
  ): Return | undefined {
    const { slowThresholdMs, noSave, metadata } = options

    if (!failure && hasSlowThreshold(slowThresholdMs) && durationMs < slowThresholdMs) {
      return undefined
    }

    let level: LoggerTimerLevel = this.#timingLevel(options)
    if (failure && (level === 'debug' || level === 'info')) level = 'warn'

    // Below the minimum level the entry is dropped before it is built.
    if (!this.isLevelEnabled(level)) return undefined

    const data = {
      ...metadata,
      ...extra,
      ...(failure ? describeFailure(failure.error) : {}),
      label,
      durationMs,
      status: failure ? 'error' : 'ok',
    }
    const message = `${label} ${failure ? 'failed after' : 'took'} ${formatDuration(exact)}`

    return level === 'debug' || noSave
      ? this.#log(level, true, undefined, message, data, 'noSave')
      : this.#log(level, true, undefined, message, data)
  }
}

/** Whether `value` is a usable slow threshold: a finite number of milliseconds, zero or more. */
function hasSlowThreshold(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

/** Whether `value` is a promise (or any thenable), without assuming the `Promise` global. */
function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof (value as PromiseLike<unknown> | null)?.then === 'function'
}

/**
 * The fields recorded for a failed measurement: the error's `name` and, when it has a string
 * `code`, that — never its `message`, `stack` or `cause`, which can hold data a timing log must not.
 */
function describeFailure(error: unknown): { errorName: string; errorCode?: string } {
  const errorName = error instanceof Error ? error.name : typeof error
  const code = (error as { code?: unknown } | null)?.code
  return typeof code === 'string' ? { errorName, errorCode: code } : { errorName }
}

// Re-exported only so this file's own public signatures (`Logger`'s default `Return` generic,
// `Logger#ingest`'s parameters, `FileSaveFactory`) resolve for `deno doc --lint` — the same
// `LoggerFileOptions`/`LoggerFunctionOptions` precedent `typings/logger.ts` already documents
// for `BaseLoggerOptions`.
export type {
  BaseFormattedLog,
  BaseMethods,
  Console,
  ConsoleInfo,
  ConsoleMethodFor,
  DefaultFormattedLog,
  DefaultResponse,
  LoggerData,
  LoggerLevel,
  LoggerMethods,
  LoggerTimer,
  LoggerTimerLevel,
  LoggerTimerOptions,
  SaveDataFile,
  SaveDataFunction,
  TaskCallback,
  TaskCallbackResponse,
}

export { DEFAULT_LOGGER_LEVEL, LOG_LEVEL_ENV, LOGGER_LEVELS } from './level.ts'
