import type { ErrorOptions, HttpErrorCodes } from 'typings/errors.ts'
import httpErrorStatus from 'modules/errors/http-status-codes.ts'
import logger from 'modules/logger/mod.ts'
import { generateUUID } from 'utils/identifiers.ts'

/**
 * Function to process and sanitize external error data
 * @param this - The error instance
 * @param options - Options to customize the error.
 */
function processExtraData(this: {
  id?: string
  code?: string
  meta?: Record<string, unknown>
}, options: ErrorOptions) {
  this.id = options.id || generateUUID()
  if (options.code) this.code = options.code
  else delete this.code

  if (options.meta) this.meta = options.meta
  else delete this.meta
}

/**
 * A custom error class for runtime server `exceptions`, extending Deno's `Interrupted` error class.
 *
 * This class allows for more detailed and structured error handling, including associating
 * error codes with their corresponding internal server codes and providing customizable error messages.
 * It is particularly useful for throwing and catching general server errors.
 *
 * @example
 * ```ts
 *  const error = new InternalError({
 *    message: 'Invalid input provided.',
 *  });
 *  console.log(error.message);  // "Invalid input provided."
 * ```
 *
 * @category errors
 */
export class InternalError extends Deno.errors.Interrupted {
  public override message: string
  public id?: string
  public code?: string
  public meta?: Record<string, unknown>

  /**
   * Creates an instance of the `InternalError` class.
   *
   * This constructor takes an options object, allowing for customization
   * of the error message and the optional cause of the erro
   *
   * @param {string} [message] - The main error message
   * @param {Object} options - Options to customize the error message and cause. This is optional.
   * @param {boolean} [options.shouldLog] - Whether to log this error using the system logger.
   * @param {Record<string, unknown>} [options.meta] - The meta options for internal use
   * @param {string} [options.code] - The error code for internal use
   * @param {unknown} [options.cause]
   */
  constructor(
    message: string,
    options: Omit<ErrorOptions, 'message'> = {},
  ) {
    super(message, { cause: options.cause })
    this.message = message
    this.name = this.constructor.name
    this.cause = options.cause || this.cause

    processExtraData.call(this, options)

    if (options.shouldLog) logger.error(this.message, this)
  }
}

/**
 * A custom error class for HTTP-related `exceptions`, extending Deno's `Http` error class.
 *
 * This class allows for more detailed and structured error handling, including associating
 * error codes with their corresponding HTTP status codes and providing customizable error messages.
 * It is particularly useful for throwing and catching HTTP errors with standardized status codes
 * in web applications or APIs.
 *
 * The class includes the error code, HTTP status value, and a detailed error message.
 * The `status` object consists of:
 * - `code`: The HTTP error code (e.g., 'BAD_REQUEST', 'NOT_FOUND').
 * - `value`: The corresponding HTTP status code (e.g., 400 for 'BAD_REQUEST').
 *
 * @example
 * ```ts
 *  const error = new HttpError('BAD_REQUEST', {
 *    message: 'Invalid input provided.',
 *  });
 *  console.log(error.message);  // "Invalid input provided."
 *  console.log(error.status.code);  // 'BAD_REQUEST'
 *  console.log(error.status.value);  // 400
 * ```
 *
 * @category errors
 */
export class HttpError extends Deno.errors.Http {
  public override message: string
  public id?: string
  public code?: string
  public meta?: Record<string, unknown>
  public status: { code: HttpErrorCodes; value: number }

  /**
   * Creates an instance of the `HttpError` class.
   *
   * This constructor takes an HTTP error code and an options object, allowing for customization
   * of the error message and the optional cause of the error. The error code is mapped to its
   * corresponding HTTP status value (e.g., 400 for 'BAD_REQUEST') using the `httpErrorStatus` mapping.
   * The error name is automatically set to the class name.
   *
   * @param {HttpErrorCodes} code - The error code (e.g., 'BAD_REQUEST', 'NOT_FOUND') that defines the type of error.
   * @param {Object} options - Options to customize the error message and cause. This is optional.
   * @param {string} [options.message] - The main error message
   * @param {boolean} [options.shouldLog] - Whether to log this error using the system logger.
   * @param {Record<string, unknown>} [options.meta] - The meta options for internal use
   * @param {string} [options.code] - The error code for internal use
   * @param {unknown} [options.cause]
   */
  constructor(
    code: HttpErrorCodes,
    options: ErrorOptions = {},
  ) {
    super(code, { cause: options.cause })
    this.message = options.message || code
    this.name = this.constructor.name
    this.cause = options.cause || this.cause
    this.status = {
      code,
      value: httpErrorStatus[code],
    }

    processExtraData.call(this, options)

    if (options.shouldLog) logger.error(this.message, this)
  }
}
