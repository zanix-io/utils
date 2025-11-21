import type { ErrorOptions, HttpErrorCodes } from 'typings/errors.ts'

import httpErrorStatus from 'modules/errors/http-status-codes.ts'
import { generateUUID } from 'utils/identifiers.ts'
import logger from 'modules/logger/mod.ts'

/**
 * Function to process and sanitize external error data
 * @param this - The error instance
 * @param options - Options to customize the error.
 */
function processError(this: ApplicationError | HttpError, options: ErrorOptions) {
  this.id = options.id || generateUUID()
  this.name = this.constructor.name

  if (options.code) this.code = options.code
  else delete this.code
  if (options.meta) this.meta = options.meta
  else delete this.meta
  if (options.cause) this.cause = options.cause

  if (options.shouldLog) logger.error(this.message, this)

  // Add it to the error instance in a controlled way
  Object.defineProperty(this, '_logged', {
    get: function () {
      return !!options.shouldLog
    },
    enumerable: false, // This ensures it's not visible when printing the error
  })
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
  // Define the type for the private properties
  private _logged: boolean = false

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
   * @param {boolean} [options.shouldLog] - Whether to log this error using the system logger. Defaults to `true`.
   * @param {Record<string, unknown>} [options.meta] - The meta options for internal use
   * @param {string} [options.code] - An optional code identifier for internal use.
   * @param {unknown} [options.cause] - An optional cause for the error, such as an inner exception or error.
   */
  constructor(
    code: HttpErrorCodes,
    options: ErrorOptions = {},
  ) {
    super(code, { cause: options.cause })
    this.message = options.message || code
    this.status = {
      code,
      value: httpErrorStatus[code],
    }

    processError.call(this, options)
  }
}

/**
 * A custom error class for handling general application errors, extending the `Error` class.
 *
 * This class allows for detailed error tracking with additional properties like error codes,
 * metadata, and unique identifiers. Ideal for throwing and catching general application errors.
 *
 * @example
 * ```ts
 *  const error = new ApplicationError('Something went wrong!', {
 *    code: 'APPLICATION_ERROR',
 *    meta: { userId: '12345' },
 *  });
 * ```
 *
 * @category errors
 */
export class ApplicationError extends Error {
  public override message: string
  public id?: string
  public code?: string
  public meta?: Record<string, unknown>
  // Define the type for the private properties
  private _logged: boolean = false

  /**
   * Creates an instance of the `ApplicationError` class.
   *
   * This constructor takes an options object, allowing for customization
   * of the error message and the optional cause of the error
   *
   * @param {string} [message] - The main error message
   * @param {Object} options - Options to customize the error message and cause. This is optional.
   * @param {boolean} [options.shouldLog] - Whether to log this error using the system logger. Defaults to `false`.
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

    processError.call(this, options)
  }
}

/**
 * Custom error class to represent permission-related exceptions, extending Zanix's `ApplicationError` class.
 *
 * This error is thrown when a user or process attempts to access a resource or perform an action
 * that requires specific permissions, but those permissions are not granted or insufficient.
 * It provides a more specific way to handle permission-related errors, improving error reporting
 * and debugging in applications.
 *
 * @example
 * ```ts
 *  const error = new PermissionDenied('No token provided.');
 * ```
 *
 * @category errors
 */
export class PermissionDenied extends ApplicationError {}

/**
 * A custom error class for runtime server `exceptions`, extending Zanix's `ApplicationError` error class.
 *
 * ⚠️ This errors are considered critical errors.
 *
 * This class allows for more detailed and structured error handling, including associating
 * error codes with their corresponding internal server codes and providing customizable error messages.
 * It is particularly useful for throwing and catching general server errors.
 *
 * @example
 * ```ts
 *  const error = new InternalError('Invalid input provided.');
 *  console.log(error.message);  // "Invalid input provided."
 * ```
 *
 * @category errors
 */
export class InternalError extends ApplicationError {
  /**
   * Creates an instance of the `InternalError` class.
   *
   * This constructor takes an options object, allowing for customization
   * of the error message and the optional cause of the erro
   *
   * @param {string} [message] - The main error message
   * @param {Object} options - Options to customize the error message and cause. This is optional.
   * @param {boolean} [options.shouldLog] - Whether to log this error using the system logger. Defaults to `true`.
   * @param {Record<string, unknown>} [options.meta] - The meta options for internal use
   * @param {string} [options.code] - An optional code identifier for internal use.
   * @param {unknown} [options.cause] - An optional cause for the error, such as an inner exception or error.
   */
  constructor(
    message: string,
    options: Omit<ErrorOptions, 'message'> = {},
  ) {
    options.shouldLog = options.shouldLog ?? true
    super(message, options)
  }
}
