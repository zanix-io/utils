import type { ValidationDecorator, ValidationDecoratorDefinition } from 'typings/validations.ts'

import { defineValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'

/**
 * has valid length
 *
 * @param value
 * @param min
 * @param max
 * @returns {boolean}
 *
 * @category validations
 */
export function stringLength(value: string, min: number, max: number): boolean {
  return (typeof value === 'string' && value.length >= min && value.length <= max)
}

/**
 *  Validate each array values length
 *
 * @param value
 * @param min
 * @param max
 * @returns {boolean}
 *
 * @category validations
 */
export function stringLengthArray(values: string[], min: number, max: number): boolean {
  try {
    return !values.some((val) => (typeof val !== 'string' || val.length < min || val.length > max))
  } catch {
    return false
  }
}

/**
 * Decorator to validate that a value is a string and has a length between the specified min and max.
 * @param constraints The constraints
 *   - min: (Optional) The minimum allowed length.
 *   - max: (Optional) The maximum allowed length.
 * @param options Optional validation settings, including a custom error message.
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 * @category validations
 */
export const Length: ValidationDecorator<{ min?: number; max?: number }> = function (
  constraints,
  options = {},
): ValidationDecoratorDefinition {
  const { min = 0, max = Infinity } = constraints

  const baseMessage = max === Infinity
    ? `at least ${min} characters.`
    : `length between ${min} and ${max} characters.`
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) =>
      `All values of '${property}' must be strings with ${baseMessage}`
    validation = (value: string[]) => stringLengthArray(value, min, max)
  } else {
    defaultMessage = (property: string) => `'${property}' must be a string with ${baseMessage}`
    validation = (value: string) => stringLength(value, min, max)
  }

  return defineValidationDecorator(validation, { message: defaultMessage, ...options })
}
