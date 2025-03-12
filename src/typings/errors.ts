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

type BaseSerializeError = Partial<{
  name: string
  message: string
  stack: string
}>

export type SerializeError<T extends BaseSerializeError = BaseSerializeError> = T
