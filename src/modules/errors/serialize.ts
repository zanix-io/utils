import type { SerializeError } from 'typings/errors.ts'

/**
 * Serializes an error into a plain object.
 *
 * This function checks if the provided input is an instance of `Error`.
 * If it is, it extracts the `name`, `message`, and `stack` properties of the error and combines them with the serialized base data.
 * If the input is not an `Error`, it simply returns the serialized base data.
 *
 * In case of an error during serialization, the function returns the original input.
 *
 * @param error - The error (or unknown value) to serialize.
 * @returns A plain object representing the serialized error or the original input if serialization fails.
 */
export function serializeError(error: unknown): SerializeError {
  const isError = error instanceof Error
  try {
    const baseData = JSON.parse(JSON.stringify(error))
    if (!isError) return baseData
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...baseData,
    }
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
 * @returns An array of serialized objects, where each object represents the corresponding error or value.
 */
export function serializeMultipleErrors<T>(errors: T[]): (SerializeError)[] {
  return errors.map((errors) => serializeError(errors))
}
