import type { TaskerCallback } from 'typings/workers.ts'

type Console = typeof console

/** The base method types */
export type BaseMethods = Exclude<LoggerMethods, 'success'>

type ConsoleInfo<Method extends BaseMethods> = Console[Method]

/** The logger available methods types */
export type LoggerMethods = 'info' | 'error' | 'warn' | 'debug' | 'success'

/** The Logger data to be shown */
export type LoggerData<Method extends LoggerMethods = 'info'> = Method extends 'success'
  ? [message: string, noSave?: 'noSave']
  : [
    message: string,
    ...data: [...Parameters<ConsoleInfo<Exclude<Method, 'success'>>>, noSave?: 'noSave'],
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
    userId: number | null
  }
}

/** Formatter function type */
export type Formatter<T extends BaseFormattedLog = BaseFormattedLog> = (
  level: LoggerMethods,
  log: LoggerData,
) => T

/** The save log data function */
export type SaveDataFunction<Return extends unknown = unknown, BaseContext = object> = (
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
export type SaveDataFunctionOptions<Return extends unknown = unknown, BaseContext = object> = {
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
     * A flag that determines whether a worker should be used for processing.
     * Only set to true when necessary, as using workers can add overhead.
     */
    useWorker?: false
  } | {
    /**
     * A flag that determines whether a worker should be used for processing.
     * Only set to true when necessary, as using workers can add overhead.
     */
    useWorker?: true
    /**
     * Callback function to be executed when the process completes.
     * It is recommended to use this only when `useWorker` is set to `true`.
     */
    callback?: TaskerCallback
  })

/** The save log data options as a file */
export type SaveDataFileOptions = {
  /**
   * Indicates whether logs should be saved to a file.
   */
  save?: SaveDataFile
}

/** The base storage options */
type BaseStorage = {
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

/** The base logger class options */
type BaseLoggerOptions<
  Return extends unknown,
  Storage extends 'saveFile' | 'saveFunction',
> = {
  /**
   * Disables the assignment of the logger to the global scope.
   * When enabled, the logger will not be assigned to `globalThis` or any global state like `Znx.logger`.
   */
  disableGlobalAssign?: boolean
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

export type LoggerFileOptions<Return extends unknown> = BaseLoggerOptions<Return, 'saveFile'>

export type LoggerFunctionOptions<Return extends unknown> = BaseLoggerOptions<
  Return,
  'saveFunction'
>

/** The logger class options*/
export type LoggerOptions<Return extends unknown> =
  | LoggerFunctionOptions<Return>
  | LoggerFileOptions<Return>
