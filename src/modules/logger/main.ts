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
import { createRedactor } from 'modules/errors/redact.ts'
import { baseFormatter } from 'modules/logger/defaults/formatter.ts'
import { setGlobalZnx } from 'modules/helpers/zanix/namespace.ts'
import { baseSaveData } from './defaults/storage/main.ts'
import { showMessage } from './base.ts'

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

    this.#redact = createRedactor(options.redact)

    if (options.storage !== false) {
      const { storage = {} } = options
      this.#formatter = baseFormatter(storage.formatter, this.#redact)
      this.#saveFuntion = baseSaveData(storage.save, this.#redact)
    }
  }

  /**
   * Redacts `data` exactly once — the single result is reused for both `showMessage` (console) and
   * `#storage` (file/custom `storage.save` — Elasticsearch included), rather than each redacting
   * its own copy of the same raw input. `showMessage` itself never redacts (see its own doc), so
   * this is the only place that does for this call.
   */
  #log(type: LoggerMethods, ...data: LoggerData): Return | undefined {
    const hasNoSave = data[data.length - 1] === 'noSave'
    if (hasNoSave) data.length = data.length - 1

    const redactedData = data.map(this.#redact) as LoggerData
    showMessage(type, ...redactedData)
    if (hasNoSave) return undefined

    return this.#storage(type, redactedData) as Return
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
    // `redact: false` — this only needs to flatten each `Error` into a plain, serializable shape
    // and dedupe already-logged instances. `#log` redacts the result (using this instance's own
    // `redact` option) right after, so redacting here too would just walk the same data twice.
    const errors = serializeMultipleErrors(rest, { redact: false })

    if (!errors.length && rest.length) return
    return this.#log('error', message, ...errors)
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
