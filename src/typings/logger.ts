import type { TaskCallback } from 'typings/workers.ts'
import type { RedactOptions } from 'typings/errors.ts'

/** The type of the global `console` object. */
export type Console = typeof console

/** The base method types */
export type BaseMethods = Exclude<LoggerMethods, 'success'>

/**
 * The real `console` method a given base logger method's argument shape is borrowed from.
 * `console` has no `console.high` — `'high'` reuses `console.error`'s parameter shape (and, per
 * {@linkcode showMessage}, its underlying console method) since it's the closer of the two native
 * methods to `'high'`'s own "needs attention soon" severity.
 */
export type ConsoleMethodFor<Method extends BaseMethods> = Method extends 'high' ? 'error' : Method

/** The native `console` method invoked for a given base logger method. */
export type ConsoleInfo<Method extends BaseMethods> = Console[ConsoleMethodFor<Method>]

/**
 * The logger available methods types.
 *
 * `'high'` sits between `'warn'` and `'error'`: an anomalous condition that deserves attention
 * sooner than a routine `warn`, but where the operation itself didn't necessarily fail outright
 * (unlike `'error'`). Persisted by default, same as `'warn'`/`'error'` — see `docs/logger.md`.
 */
export type LoggerMethods = 'info' | 'error' | 'high' | 'warn' | 'debug' | 'success'

/**
 * The minimum level a `Logger` handles, from the least to the most severe: `'debug'`, `'info'`,
 * `'warn'`, `'high'`, `'error'`, and `'silent'` (above every method, so nothing is handled). An
 * entry below the level is neither printed nor persisted. `'success'` ranks with `'info'`.
 * The default is `'debug'`: everything is handled. See `docs/logger.md`.
 */
export type LoggerLevel = 'debug' | 'info' | 'warn' | 'high' | 'error' | 'silent'

/** The Logger data to be shown */
export type LoggerData<Method extends LoggerMethods = 'info'> = Method extends 'success' ? string
  : [
    message: string,
    ...data: [
      ...Parameters<ConsoleInfo<Exclude<Method, 'success'>>>,
      noSave?: 'noSave',
    ],
  ]

/** The base formatted log object */
export type BaseFormattedLog = Record<string, unknown>

/** The log method default response */
export type DefaultResponse = Promise<void>

/** The default formatted log object */
export type DefaultFormattedLog = {
  id: string
  timestamp: string
  level: LoggerMethods
  message: string
  data: LoggerData[1][]
  context: {
    processId: number | null
  }
  /**
   * Where this entry actually came from — present only on a log persisted via `Logger#ingest`
   * (e.g. `'client'`, its own default, for one relayed from a browser's `createClientLogger`
   * instance); absent on anything logged locally through `debug`/`info`/`warn`/`error`/`high`.
   */
  origin?: string
}

/** Formatter function type */
export type Formatter<T extends BaseFormattedLog = BaseFormattedLog> = (
  level: LoggerMethods,
  log: LoggerData,
) => T

/** The save log data function */
export type SaveDataFunction<
  Return extends unknown = unknown,
  BaseContext = object,
> = (
  context: {
    /**
     * Retrieves a formatted log object.
     * The log is returned as a generic type that extends `BaseFormattedLog`,
     * allowing for flexibility in specifying the type of log format.
     */
    getFmtLog: <T extends BaseFormattedLog = DefaultFormattedLog>() => T
  } & BaseContext,
) => Return

/** The save log data options as a function */
export type SaveDataFunctionOptions<
  Return extends unknown = unknown,
  BaseContext = object,
> = {
  /**
   * This function handles the custom storage of logs after they have been processed and formatted.
   *
   * @param context - The context object containing properties required for saving the data.
   *
   * @see {@link SaveDataFile} for the default log saving method.
   *
   * @example
   *
   * ```ts
   * new Logger({
   *   storage: {
   *     save: (context) => {
   *       const data = context.getFmtLog()
   *       functionToSave(data)
   *     },
   *   },
   * })
   * ```
   */
  save: SaveDataFunction<Return, BaseContext>
}

/** The save log data as a file */
export type SaveDataFile =
  & {
    /**
     * Local URI folder to save file log
     */
    folder?: string
    /**
     * The number of days before a log file expires.
     * Once expired, the file will be deleted automatically.
     */
    expirationTime?: `${number}d`
  }
  & ({
    /**
     * Determines whether a one-time worker should be used to save log data.
     * Enable only for heavy or resource-intensive log storage operations,
     * since using a worker adds extra overhead to the process.
     */
    useWorker?: false
  } | {
    /**
     * Determines whether a one-time worker should be used to save log data.
     * Enable only for heavy or resource-intensive log storage operations,
     * since using a worker adds extra overhead to the process.
     */
    useWorker?: true
    /**
     * Callback function executed when the worker finishes processing.
     * Should be used only if `useWorker` is `true`, as it handles post-processing
     * or cleanup after the log-saving task completes.
     */
    callback?: TaskCallback
  })

/** The save log data options as a file */
export type SaveDataFileOptions = {
  /**
   * Indicates whether logs should be saved to a file.
   */
  save?: SaveDataFile
}

/**
 * The base storage options. Exported only so `LoggerFileOptions`/`LoggerFunctionOptions` (via
 * `BaseLoggerOptions`) resolve for `deno doc --lint` — use `LoggerFileOptions`/
 * `LoggerFunctionOptions` directly instead of this type.
 */
export type BaseStorage = {
  /**
   * This function allows you to modify or transform the data (e.g., formatting, sanitization)
   * prior to storage. If not provided, a default format will be applied.
   *
   * @example
   *
   * ```ts
   * (level: LoggerMethods, [message, ...data]: LoggerData) => ({message, level, data});
   *
   * ```
   */
  formatter?: Formatter
}

/**
 * The base logger class options. Exported only so `LoggerFileOptions`/`LoggerFunctionOptions`
 * resolve for `deno doc --lint` — use `LoggerFileOptions`/`LoggerFunctionOptions` directly instead
 * of this type.
 */
export type BaseLoggerOptions<
  Return extends unknown,
  Storage extends 'saveFile' | 'saveFunction',
> = {
  /**
   * Disables the assignment of the logger to the global scope.
   * When enabled, the logger will not be assigned to `globalThis` or any global state like `Znx.logger`.
   */
  disableGlobalAssign?: boolean
  /**
   * The minimum level this logger handles: an entry below it is neither printed nor persisted
   * (a relayed `ingest` entry included). `'silent'` handles nothing. When it is not given, the
   * `LOG_LEVEL` environment variable is read once, when the logger is created; when that is not
   * set either, the level is `'debug'` and everything is handled, as before. A value that is not a
   * level is reported once and ignored. Change it later with `Logger#setLevel`.
   *
   * @default 'debug'
   *
   * @example
   *
   * ```ts
   * // Only warnings and worse reach the console and the storage.
   * new Logger({ level: 'warn' })
   * ```
   */
  level?: LoggerLevel
  /**
   * Controls redaction of sensitive-looking data (credential-shaped keys, `Headers`/`Request`
   * objects) before a log reaches the console or storage. See {@link RedactOptions}.
   *
   * @default true
   *
   * @example
   *
   * ```ts
   * // Disable entirely — only safe when this logger's output is already fully trusted.
   * new Logger({ redact: false })
   *
   * // Also redact a couple of extra key names, on top of (not instead of) the built-in pattern.
   * new Logger({ redact: { extend: ['dbPassword', /secret$/i] } })
   *
   * // Match this codebase's own conventions instead of the built-in pattern.
   * new Logger({ redact: { pattern: /^(authorization|x-internal-.*)$/i } })
   * ```
   */
  redact?: RedactOptions
  /**
   * Configuration object for handling the storage of logs or data.
   * Contains settings for formatting the data before saving and specifying the location or path to save the data.
   *
   * @property formatter - Optional formatter function to process the data before saving.
   * @property save - Function responsible for saving the data.
   */
  storage?:
    | BaseStorage
      & (Storage extends 'saveFunction' ? SaveDataFunctionOptions<Return>
        : SaveDataFileOptions)
    | false
}

/** `LoggerOptions`'s file-based-storage half — `storage.save` is a `SaveDataFile` config object. */
export type LoggerFileOptions<Return extends unknown> = BaseLoggerOptions<
  Return,
  'saveFile'
>

/** `LoggerOptions`'s function-based-storage half — `storage.save` is a `SaveDataFunction`. */
export type LoggerFunctionOptions<Return extends unknown> = BaseLoggerOptions<
  Return,
  'saveFunction'
>

/** The logger class options*/
export type LoggerOptions<Return extends unknown> =
  | LoggerFunctionOptions<Return>
  | LoggerFileOptions<Return>

/** The levels a duration measurement can be logged at. `success` is left out: it has no data slot. */
export type LoggerTimerLevel = Exclude<LoggerMethods, 'success' | 'error'>

/** Options of `Logger#timer` and `Logger#time`. */
export type LoggerTimerOptions = {
  /**
   * The level a measurement is logged at. Defaults to `'debug'` (printed, never persisted, so
   * timing every call stays cheap), or to `'warn'` when {@linkcode slowThresholdMs} is set: a
   * measurement kept only because it was slow is worth persisting. A failed measurement (see
   * `Logger#time`) is raised to `'warn'` when this would be `'debug'` or `'info'`. `'error'` is not
   * accepted: a measurement is not itself an error, and `logger.error` marks the error it receives
   * as already logged, which would change how the caller's own error handling sees it.
   */
  level?: LoggerTimerLevel
  /**
   * Log only measurements that took at least this many milliseconds; faster ones are measured and
   * dropped without printing or persisting anything. A failure is always logged, whatever it took.
   * Ignored when it is not a finite, non-negative number.
   */
  slowThresholdMs?: number
  /** Never persist this measurement, even at a level that persists (`'info'`, `'warn'`, `'high'`). */
  noSave?: boolean
  /**
   * Extra fields for the log entry, redacted by key exactly like any other logged data. The fixed
   * fields (`label`, `durationMs`, `status`, `errorName`, `errorCode`) are written last and cannot
   * be overridden from here.
   */
  metadata?: Record<string, unknown>
  /**
   * The monotonic clock, in milliseconds. Defaults to `performance.now()`. A controllable one lets
   * a test assert exact durations.
   */
  clock?: () => number
}

/** A running measurement started by `Logger#timer`. */
export type LoggerTimer = {
  /** Milliseconds elapsed so far, unrounded. Reading it logs nothing and does not stop the timer. */
  elapsed(): number
  /**
   * Stops the timer and logs the measurement once, then returns the duration in milliseconds
   * (rounded to two decimals). Calling it again returns the same duration and logs nothing.
   * @param metadata - Extra fields for this entry, merged over the timer's own `metadata`.
   */
  stop(metadata?: Record<string, unknown>): number
  /** Stops the timer, so `using timer = logger.timer('x')` logs when the scope ends. */
  [Symbol.dispose](): void
}
