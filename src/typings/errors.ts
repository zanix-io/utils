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
 * against a custom pattern instead of the built-in one; `{ extend }` keeps whichever pattern
 * applies (built-in, or `pattern` if also given) and additionally redacts any key matching one of
 * `extend`'s own entries — a plain string is matched as an exact key name, case-insensitively,
 * the same way every built-in entry is; a `RegExp` is tested against the key directly, for a rule
 * broader than one literal name (e.g. `/secret$/i` to catch any `...Secret`-suffixed key). Additive
 * by design specifically so a caller doesn't have to reconstruct the built-in pattern from scratch
 * just to add one more sensitive key name on top of it.
 */
export type RedactOptions = boolean | { pattern?: RegExp; extend?: (string | RegExp)[] }

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
   * An optional, safe message meant to be shown directly to an end user — as opposed to
   * `message`, which stays technical/dev-facing (used in logs, `cause` chains, and API responses
   * consumed by another developer's code). Not every error reaches an end user at all (most don't
   * — a failed DB connector, a rejected internal service call), so this is deliberately optional:
   * set it only on errors a caller might realistically surface directly in a UI, and never assume
   * `message` itself is safe to show a non-technical audience — it's written for whoever is
   * debugging the failure, not for whoever triggered it.
   */
  userMessage?: string
  /**
   * Whether `meta` is safe to include in a client-facing response (e.g. `@zanix/server`'s
   * `getPublicErrorResponse`/`httpErrorResponse`), as opposed to only ever reaching the log
   * `meta` is persisted to regardless of this flag. Defaults to `false`: most `meta` values are
   * internal debugging context (a connector name, an internal id, a diagnostic reason) that was
   * never meant for whoever called the API — set this only on an error whose `meta` you've
   * deliberately shaped to be safe and useful for that caller (e.g. structured validation-failure
   * detail).
   */
  exposeMeta?: boolean
  /**
   * Whether `cause` is safe to include in a client-facing response, same rationale as
   * {@link exposeMeta}. Defaults to `false`: a `cause` is frequently another system's raw error
   * (a driver, a downstream service) and can carry detail — connection strings, internal
   * hostnames, a third party's own error text — that was never meant to leave the process. `cause`
   * is still always available to whatever logs this error, regardless of this flag.
   */
  exposeCause?: boolean
  /**
   * An optional flag that determines whether to log the error using the system logger.
   */
  shouldLog?: boolean
}
