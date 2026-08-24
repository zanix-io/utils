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
  LoggerMethods,
  LoggerOptions,
  SaveDataFile,
  SaveDataFunction,
} from 'typings/logger.ts'
import type { TaskCallback, TaskCallbackResponse } from 'typings/workers.ts'

import { serializeMultipleErrors } from 'modules/errors/serialize.ts'
import { createRedactor } from 'modules/errors/redact.ts'
import { baseFormatter } from 'modules/logger/defaults/formatter.ts'
import { setGlobalZnx } from 'modules/helpers/zanix/namespace.ts'
import { baseSaveData, saveDataFetcherFunction } from './defaults/storage/main.ts'
import { showMessage } from './base.ts'

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
 * @param options - Just `disableGlobalAssign` — a plain, standalone shape rather than
 * `Pick<LoggerFunctionOptions<...>, 'disableGlobalAssign'>`, deliberately: everything else about
 * the underlying `Logger` (storage, formatting) is fixed by this function's own contract, so no
 * other `LoggerFunctionOptions` field belongs here, and reusing that type would pull its own
 * unrelated `storage`/`redact` fields into this signature for no reason.
 */
export function createClientLogger(
  fetcher: <T extends BaseFormattedLog = DefaultFormattedLog>(fmtLog: T) => void | Promise<void>,
  options: { disableGlobalAssign?: boolean } = {},
): Logger {
  const { disableGlobalAssign = true } = options
  return new Logger<DefaultResponse>({
    disableGlobalAssign,
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
    const { storage, disableGlobalAssign, redact } = options
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
   * @param origin - Forwarded to `#storage` as a top-level `origin` field on the persisted (and,
   * if `print`, shown) formatted log — only {@linkcode ingest} passes one; every other method
   * passes `undefined`. Kept OUT of `data` entirely (not appended/redacted alongside it), so a
   * caller's own genuine trailing `'noSave'` sentinel (the last element of `data` itself) is still
   * exactly what gets checked below — nothing about `origin` can ever displace it from that
   * position.
   */
  #log(
    type: LoggerMethods,
    print: boolean,
    origin: string | undefined,
    ...data: LoggerData
  ): Return | undefined {
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
  LoggerMethods,
  SaveDataFile,
  SaveDataFunction,
  TaskCallback,
  TaskCallbackResponse,
}
