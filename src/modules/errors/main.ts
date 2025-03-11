import type { HttpErrorCodes } from 'typings/errors.ts'
import httpErrorStatus from 'modules/errors/http-status-codes.ts'
import logger from 'modules/logger/mod.ts'
import { serializeError } from 'modules/errors/serialize.ts'

/**
 * @class HttpError
 * @extends {Deno.errors.Http}
 *
 * A custom error class for HTTP-related errors, extending Deno's `Http` error class.
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
 */
export class HttpError extends Deno.errors.Http {
  public override message: string
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
   * @param {string} [options.message]
   * @param {unknown} [options.log]
   * @param {unknown} [options.cause]
   *
   * @throws {TypeError} If the provided error code does not exist in `httpErrorStatus`.
   */
  constructor(
    code: HttpErrorCodes,
    options: {
      /**
       * An optional custom message describing the error. If not provided, the error code is used as the message.
       */
      message?: string
      /**
       * An optional flag that determines whether the error should be logged.
       */
      cause?: unknown
      /**
       * An optional cause for the error, such as an inner exception or error.
       */
      log?: boolean
    } = {},
  ) {
    super(code, { cause: options.cause })
    this.message = options.message || code
    this.name = this.constructor.name
    this.cause = serializeError(options.cause) || this.cause
    this.status = {
      code,
      value: httpErrorStatus[code],
    }

    if (options.log) logger.error(this.message, this)
  }
}
