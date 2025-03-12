import type { HttpErrorCodes } from 'typings/errors.ts'

/**
 * A mapping object that associates `HTTP` error `codes` with their corresponding HTTP `status` codes.
 *
 * This object helps map the error codes (e.g., 'BAD_REQUEST', 'NOT_FOUND') to their respective HTTP status
 * codes (e.g., 400, 404), making it easier to return appropriate status codes in API responses when errors
 * occur. It is used in conjunction with custom error classes like `HttpError` to provide detailed error responses
 * with both a status code and a descriptive message.
 *
 * @example
 * const errorCode = 'BAD_REQUEST';
 * const statusCode = httpErrorStatus[errorCode];  // 400
 *
 * @type {Record<HttpErrorCodes, number>}
 *
 * @category errors
 */
const httpErrorStates: Record<HttpErrorCodes, number> = {
  // 4xx Client Errors (Client-side errors, when the request is invalid or malformed)
  /** Bad Request: The request is incorrect or malformed */
  BAD_REQUEST: 400,
  /** Unauthorized: Authentication credentials are missing or invalid */
  UNAUTHORIZED: 401,
  /** Forbidden: The server understands the request but refuses to authorize it */
  FORBIDDEN: 403,
  /** Not Found: The requested resource could not be found */
  NOT_FOUND: 404,
  /** Method Not Allowed: The HTTP method is not allowed for the resource */
  METHOD_NOT_ALLOWED: 405,
  /** Conflict: There is a conflict with the current state of the resource */
  CONFLICT: 409,
  /** Payload Too Large: The request payload exceeds the size limit */
  PAYLOAD_TOO_LARGE: 413,
  /** Unsupported Media Type: The media type in the request is not supported */
  UNSUPPORTED_MEDIA_TYPE: 415,
  /** Unprocessable Entity: The request is understood, but the server cannot process it */
  UNPROCESSABLE_ENTITY: 422,
  /** Too Many Requests: The client has sent too many requests in a short period of time */
  TOO_MANY_REQUESTS: 429,

  // 5xx Server Errors (Server-side errors, when there is a problem with the server)
  /**  Internal Server Error: A generic server error */
  INTERNAL_SERVER_ERROR: 500,
  /** Not Implemented: The server does not support the functionality required */
  NOT_IMPLEMENTED: 501,
  /** Bad Gateway: The server received an invalid response from an upstream server */
  BAD_GATEWAY: 502,
  /** Service Unavailable: The server is temporarily unavailable (overloaded or in maintenance) */
  SERVICE_UNAVAILABLE: 503,
  /** Gateway Timeout: The server did not receive a timely response from an upstream server */
  GATEWAY_TIMEOUT: 504,
}

export default httpErrorStates
