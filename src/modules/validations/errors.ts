import type { ValidationError } from 'typings/validations.ts'

/**
 * Formats validation errors for a given object and converts them into a structured error message.
 * This function processes a list of validation errors and maps them to a more user-friendly format,
 * optionally including the provided object for context.
 *
 * @param errors - The array of validation errors to be formatted.
 * @param obj - The object that was validated. This can be used to include additional context or reference information in the error formatting.
 *
 * @returns A formatted error message or object containing the error details.
 */

export function errorValidationFormatting(
  errors: (ValidationError | undefined)[],
  // deno-lint-ignore no-explicit-any
  obj: Record<string, any> = {},
) {
  for (const error of errors) {
    const { property, constraints = [], plainValue, children, value } = error || {}
    if (!property) continue
    const objProp = obj[property]

    if (children && children.length > 0) {
      obj[property] = {
        message: constraints[0],
        properties: errorValidationFormatting(children, objProp),
      }
    } else if (constraints) {
      const porpValue = { constraints, value: value, plainValue }
      if (!objProp) obj[property] = [porpValue]
      else obj[property].push(porpValue)
    }
  }

  return obj
}
