import type {
  DefaultResponse,
  Formatter,
  LoggerData,
  LoggerFileOptions,
  LoggerFunctionOptions,
  LoggerMethods,
  LoggerOptions,
  SaveDataFunction,
} from 'typings/logger.ts'

import { serializeMultipleErrors } from 'modules/errors/serialize.ts'
import { baseFormatter } from 'modules/logger/defaults/formatter.ts'
import { setGlobalZnx } from 'modules/helpers/zanix/namespace.ts'
import { baseSaveData } from './defaults/storage/main.ts'
import { showMessage } from './base.ts'

export class Logger<Return extends unknown = DefaultResponse> {
  #formatter: Formatter = () => ({})
  #saveFuntion: SaveDataFunction = () => {}

  /**
   * @param options Configuration options for the Logger class with a function-based save mode.
   */
  constructor(options?: LoggerFunctionOptions<Return>)
  /**
   * @param options Configuration options for the Logger class with file-based save mode.
   */
  constructor(options?: LoggerFileOptions<Return>)
  constructor(options: LoggerOptions<Return> = {}) {
    const globals: Partial<typeof Znx> = {}

    // Assign the logger globally before instance creation unless disabled.
    // Skipped if disableGlobalAssign is true.
    if (!options.disableGlobalAssign) {
      globals.logger = this
      Object.assign(globalThis, { logger: globals.logger })
    }

    // Initialize global configuration for Znx.
    // This ensures Znx's `baseSaveData` method has the necessary global configuration.
    setGlobalZnx(globals)

    if (options.storage !== false) {
      const { storage = {} } = options
      this.#formatter = baseFormatter(storage.formatter)
      this.#saveFuntion = baseSaveData(storage.save)
    }
  }

  #log(type: LoggerMethods, ...data: LoggerData): Return | undefined {
    if (data[data.length - 1] === 'noSave') {
      data.length = data.length - 1
      showMessage(type, ...data)
      return undefined
    }
    showMessage(type, ...data)
    return this.#storage(type, data) as Return
  }

  #storage(type: LoggerMethods, log: LoggerData) {
    return this.#saveFuntion({
      getFmtLog: <T>() => this.#formatter(type, log) as T,
    })
  }

  /**
   * Logs a debug message along with additional parameters.
   * @param data - Values to be printed to the console.
   */
  public debug(...data: LoggerData<'debug'>): Return | undefined {
    return this.#log('debug', ...data, 'noSave')
  }

  /**
   * Logs an error message with additional parameters.
   * @param data - Values to be printed to the console.
   */
  public error(...data: LoggerData<'error'>): Return | undefined {
    const [message, ...rest] = data
    return this.#log('error', message, ...serializeMultipleErrors(rest))
  }

  /**
   * Logs a info message with additional parameters.
   * @param data - Values to be printed to the console.
   */
  public info(...data: LoggerData<'info'>): Return | undefined {
    return this.#log('info', ...data)
  }

  /**
   * Logs a success message
   * @param data - The primary message.
   */
  public success(message: LoggerData<'success'>): Return | undefined {
    return this.#log('success', message, 'noSave')
  }

  /**
   * Logs a warning message with additional parameters.
   * @param data - Values to be printed to the console.
   */
  public warn(...data: LoggerData<'warn'>): Return | undefined {
    return this.#log('warn', ...data)
  }
}
