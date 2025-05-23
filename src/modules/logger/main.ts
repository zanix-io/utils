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
    // Global assignment: This must be set before defining the instance, because of Znx use on baseSaveData
    if (!options.disableGlobalAssign) {
      Object.assign(globalThis, { logger: this })
      setGlobalZnx({ logger: this })
    }
    if (options.storage !== false) {
      const { storage = {} } = options
      this.#formatter = baseFormatter(storage.formatter)
      this.#saveFuntion = baseSaveData(storage.save)
    }
  }

  #log(type: LoggerMethods, ...console: LoggerData): Return | undefined {
    if (console[console.length - 1] === 'noSave') {
      console.length = console.length - 1
      showMessage(type, ...console)
      return undefined
    }
    showMessage(type, ...console)
    return this.#storage(type, console) as Return
  }

  #storage(type: LoggerMethods, log: LoggerData) {
    return this.#saveFuntion({
      getFmtLog: <T>() => this.#formatter(type, log) as T,
    })
  }

  /**
   * Logs a debug message along with additional parameters.
   * @param message - The primary debug message.
   * @param data - Values to be printed to the console.
   */
  public debug(...console: LoggerData<'debug'>): Return | undefined {
    return this.#log('debug', ...console)
  }

  /**
   * Logs an error message with additional parameters.
   * @param message - The primary error message.
   * @param data - Values to be printed to the console.
   */
  public error(...[message, ...console]: LoggerData<'error'>): Return | undefined {
    const args: LoggerData = [message, ...serializeMultipleErrors(console)]
    return this.#log('error', ...args)
  }

  /**
   * Logs a info message with additional parameters.
   * @param message - The primary info message.
   * @param data - Values to be printed to the console.
   */
  public info(...console: LoggerData<'info'>): Return | undefined {
    return this.#log('info', ...console)
  }

  /**
   * Logs a success message
   * @param message - The primary message.
   */
  public success(...console: LoggerData<'success'>): Return | undefined {
    return this.#log('success', ...console)
  }

  /**
   * Logs a warning message with additional parameters.
   * @param message - The primary warning message.
   * @param data - Values to be printed to the console.
   */
  public warn(...console: LoggerData<'warn'>): Return | undefined {
    return this.#log('warn', ...console)
  }
}
