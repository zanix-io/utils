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
