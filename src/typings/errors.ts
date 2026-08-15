/**
 * Type representing the various HTTP error codes commonly used in REST APIs.
 * These error codes are defined by the HTTP standard and are used to indicate
 * the specific reason for the failure of an HTTP request.
 *
 * Each error code corresponds to a different HTTP status code and is used to
 * represent various error scenarios in the context of client and server communication.
 */
export type HttpErrorCodes =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR'
  | 'TOO_MANY_REQUESTS'
  | 'METHOD_NOT_ALLOWED'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'UNPROCESSABLE_ENTITY'
  | 'NOT_IMPLEMENTED'
  | 'BAD_GATEWAY'
  | 'SERVICE_UNAVAILABLE'
  | 'GATEWAY_TIMEOUT'

/** The base serializable error shape: name, message, stack and cause. */
export type BaseSerializeError = Partial<{
  name: string
  message: string
  stack: string
  cause: BaseSerializeError
}>

/** A serializable error, defaulting to the base `{ message, stack, cause }` shape. */
export type SerializeError<T extends BaseSerializeError = BaseSerializeError> = T

/**
 * Controls how {@linkcode redactSensitiveData} treats a value before it reaches a console or a
 * storage backend: `true` (the default wherever this option appears) redacts using the built-in,
 * case-insensitive credential-key pattern; `false` disables redaction entirely — only safe when
 * the output is already fully trusted; `{ pattern }` keeps redaction on but matches key names
 * against a custom pattern instead of the built-in one.
 */
export type RedactOptions = boolean | { pattern?: RegExp }

/**
 * Error options to identify Custom Errors
 */
export type ErrorOptions = {
  /**
   * An optional custom message describing the error. If not provided, the error code is used as the message.
   */
  message?: string
  /**
   * An optional cause for the error, such as an inner exception or error.
   */
  cause?: unknown
  /**
   * An optional identifier used to track or reference the error trace.
   */
  id?: string
  /**
   * An optional code identifier for internal use.
   */
  code?: string
  /**
   * An optional internal used meta info
   */
  meta?: Record<string, unknown>
  /**
   * An optional flag that determines whether to log the error using the system logger.
   */
  shouldLog?: boolean
}
