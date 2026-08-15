import type { RedactOptions, SerializeError } from 'typings/errors.ts'
import { createRedactor } from './redact.ts'

/**
 * Serializes an error into a plain object.
 *
 * This function checks if the provided input is an instance of `Error`.
 * If it is, it extracts the `name`, `message`, and `stack` properties of the error and combines them with the serialized base data.
 * If the input is not an `Error`, it simply returns the serialized base data.
 *
 * In case of an error during serialization, the function returns the original input.
 *
 * Every field the error carries beyond its base shape (`meta` above all — a `cause` chain is
 * serialized the same way, recursively) is passed through {@linkcode createRedactor} first, so a
 * credential-shaped field (`authorization`, `token`, `password`, ...) never reaches a log line just
 * because it happened to end up in an error's own metadata — unless `options.redact` disables it.
 *
 * @param {unknown} error - The error (or unknown value) to serialize.
 * @param {boolean} [options.withStackTrace] - A boolean that indicates whether the stack trace should be included in the serialized error.
 *                    Defaults to `true`.
 * @param {RedactOptions} [options.redact] - Passed to {@linkcode createRedactor}. Defaults to `true`
 *                    (redaction on, built-in pattern) — see {@link RedactOptions}.
 * @returns A plain object representing the serialized error or the original input if serialization fails.
 *
 * @category errors
 */
export function serializeError(
  error: unknown,
  options: { withStackTrace?: boolean; redact?: RedactOptions } = {},
): SerializeError {
  const { withStackTrace = true, redact } = options
  const redactor = createRedactor(redact)

  const isError = error instanceof Error
  try {
    if (!isError) {
      return redactor(JSON.parse(JSON.stringify(error))) as SerializeError
    }
    const serielizedError = {
      ...error,
      name: error.name,
      message: error.message,
    } as SerializeError

    if (withStackTrace) serielizedError.stack = error.stack
    if (error.cause) {
      serielizedError.cause = serializeError(error.cause, options)
    }

    return redactor(serielizedError) as SerializeError
  } catch {
    return error as SerializeError
  }
}

/**
 * Serializes an array of errors into an array of plain objects.
 *
 * This function takes an array of errors (or any values) and serializes each one using the `serializeError` function.
 * If the values are instances of `Error`, it extracts relevant properties like `name`, `message`, and `stack`.
 * Otherwise, it serializes them as plain objects.
 *
 * @param errors - An array of errors (or unknown values) to serialize.
 * @param options - Forwarded as-is to {@linkcode serializeError} for each entry.
 * @returns An array of serialized objects, where each object represents the corresponding error or value.
 *
 * @category errors
 */
export function serializeMultipleErrors<T>(
  errors: T[],
  options: { withStackTrace?: boolean; redact?: RedactOptions } = {},
): (SerializeError)[] {
  return errors.filter((error) => {
    const isDouplicated = error['_logged' as never] === true
    if (isDouplicated) return false
    if (typeof error === 'object') {
      Object.defineProperty(error, '_logged', {
        value: true,
        enumerable: false,
      })
    }
    return true
  }).map((error) => serializeError(error, options))
}
