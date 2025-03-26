import type { ValidationDecorator, ValidationDecoratorDefinition } from 'typings/validations.ts'

import { defineValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'
import { match, matchArray } from './match.ts'
import { numericRegex } from 'utils/regex.ts'

/**
 * Is number string validation
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isNumberString(value?: string): boolean {
  return match(numericRegex, value)
}

/**
 * Is number string validation for arrays.
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isNumberStringArray(value: string[]): boolean {
  return matchArray(numericRegex, value)
}

/**
 * Decorator to validate that a value is a numeric string.
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 * @category validations
 */
export const IsNumberString: ValidationDecorator = function (
  options = {},
): ValidationDecoratorDefinition {
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) =>
      `All values of '${property}' must be valid numeric strings.`
    validation = isNumberStringArray
  } else {
    defaultMessage = (property: string) => `'${property}' must be a valid numeric string.`
    validation = isNumberString
  }

  return defineValidationDecorator(validation, { message: defaultMessage, ...options })
}
