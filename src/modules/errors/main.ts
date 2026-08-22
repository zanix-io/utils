import type { ErrorOptions, HttpErrorCodes } from 'typings/errors.ts'

import httpErrorStatus from 'modules/errors/http-status-codes.ts'
import { generateUUID } from 'utils/identifiers.ts'
import logger from 'modules/logger/mod.ts'

/**
 * Function to process and sanitize external error data
 * @param this - The error instance
 * @param options - Options to customize the error.
 */
function processError(
  this: ApplicationError | HttpError,
  options: ErrorOptions,
) {
  this.id = options.id || generateUUID()
  this.name = this.constructor.name

  if (options.code) this.code = options.code
  else delete this.code
  if (options.meta) this.meta = options.meta
  else delete this.meta
  if (options.userMessage) this.userMessage = options.userMessage
  else delete this.userMessage
  if (options.exposeMeta) this.exposeMeta = true
  else delete this.exposeMeta
  if (options.exposeCause) this.exposeCause = true
  else delete this.exposeCause
  if (options.cause) this.cause = options.cause

  if (options.shouldLog) logger.error(this.message, this)

  // A plain, writable data property — not a getter — specifically so a later, legitimate
  // assignment (`error._logged = true`, or `Object.assign(error, { _logged: true })`) actually
  // works. A getter-only accessor (this property's original shape) has no setter, so any such
  // assignment fails: it throws in strict mode (every ES module is strict) or silently no-ops in
  // sloppy mode — either way, `@zanix/server`'s `logAppError` relies on exactly this kind of
  // post-log stamp to make itself idempotent per error instance (see its own doc), and a
  // getter-only `_logged` defeats that silently (the assignment is wrapped in a `try/catch` there,
  // so the failure never surfaces) — confirmed a real, reproducible double-log this way, not just
  // a theoretical footgun. `serializeMultipleErrors`' own internal dedup (`Object.defineProperty`,
  // not assignment) already tolerated the old shape as long as this property stayed configurable,
  // so it's unaffected either way.
  Object.defineProperty(this, '_logged', {
    value: !!options.shouldLog,
    writable: true,
    configurable: true,
    enumerable: false, // This ensures it's not visible when printing the error
  })
}

/**
 * `Deno.errors.Http` itself, in Deno/server — `HttpError`'s real base class there, unchanged
 * from before. A plain `Error` everywhere else: referencing `Deno.errors.Http` directly (an
 * unguarded property access on a global that doesn't exist at all outside Deno) throws evaluating
 * this very module, before any class using it is even instantiated — real, confirmed the hard
 * way importing `@zanix/errors` from real browser-run code (`@zanix/space`'s own `defineComet`,
 * which only ever needs the browser-safe `InternalError`/`ApplicationError`, declared in this
 * same file — ESM evaluates a whole module's top-level code regardless of which export a
 * consumer actually uses, so `HttpError`'s own class declaration always runs too). `typeof Deno`
 * is a safe way to test for an undeclared global; only a direct reference throws. `HttpError`'s
 * own public behavior (`.message`/`.status`/`.stack`/`.cause`/`.meta`/`.code`) is unaffected
 * either way — every one of those is set directly in its own constructor, never inherited from
 * whichever base class is picked here.
 *
 * Exported, not a module-private variable — a real, confirmed requirement discovered fixing this:
 * JSR's own `no-slow-types` check needs the superclass expression to be a plain named variable
 * (an inline conditional directly in `extends` fails as "super class expression was too
 * complex"), but `deno doc --lint`'s own `private-type-ref` check then demands that same variable
 * be public, or it flags `HttpError` itself as referencing a private type. Exporting it satisfies
 * both. Not meant to be used directly — the export exists purely so `HttpError`'s own base class
 * can be both a plain variable AND publicly resolvable at the same time.
 */
export const HttpErrorBase: typeof Error = typeof Deno !== 'undefined' && Deno.errors?.Http
  ? (Deno.errors.Http as typeof Error)
  : Error

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
export class HttpError extends HttpErrorBase {
  /** The main error message. */
  public override message: string
  /** Unique identifier assigned to this error instance. */
  public id?: string
  /** Optional internal error code identifier. */
  public code?: string
  /** Optional metadata attached to this error for internal use. */
  public meta?: Record<string, unknown>
  /** Optional, safe message meant to be shown directly to an end user — see {@link ErrorOptions.userMessage}. */
  public userMessage?: string
  /** Whether `meta` is safe to include in a client-facing response — see {@link ErrorOptions.exposeMeta}. */
  public exposeMeta?: boolean
  /** Whether `cause` is safe to include in a client-facing response — see {@link ErrorOptions.exposeCause}. */
  public exposeCause?: boolean
  /** The HTTP error code and its corresponding numeric status value. */
  public status: { code: HttpErrorCodes; value: number }
  /** Tracks whether this error instance has already been logged, to avoid double-logging the same error when it is re-serialized (see `serializeMultipleErrors`). */
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
   * @param {boolean} [options.shouldLog] - Whether to log this error using the system logger. Defaults to `false`.
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
  /** The main error message. */
  public override message: string
  /** Unique identifier assigned to this error instance. */
  public id?: string
  /** Optional internal error code identifier. */
  public code?: string
  /** Optional metadata attached to this error for internal use. */
  public meta?: Record<string, unknown>
  /** Optional, safe message meant to be shown directly to an end user — see {@link ErrorOptions.userMessage}. */
  public userMessage?: string
  /** Whether `meta` is safe to include in a client-facing response — see {@link ErrorOptions.exposeMeta}. */
  public exposeMeta?: boolean
  /** Whether `cause` is safe to include in a client-facing response — see {@link ErrorOptions.exposeCause}. */
  public exposeCause?: boolean
  /** Tracks whether this error instance has already been logged, to avoid double-logging the same error when it is re-serialized (see `serializeMultipleErrors`). */
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
 * This class allows for more detailed and structured error handling, with error codes,
 * metadata, and customizable error messages, and defaults to logging the error. It is
 * particularly useful for throwing and catching general server errors.
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
