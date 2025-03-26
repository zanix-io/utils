import type { ValidationDecorator, ValidationDecoratorDefinition } from 'typings/validations.ts'

import { defineValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'

/**
 * Is string validation
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isString(value?: string): boolean {
  return typeof value === 'string'
}

/**
 * Is string validation for arrays.
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isStringArray(value: string[]): boolean {
  try {
    return !value.some((val) => typeof val !== 'string')
  } catch {
    return false
  }
}

/**
 * Decorator to validate that a value is a string.
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 * @category validations
 */
export const IsString: ValidationDecorator = function (
  options = {},
): ValidationDecoratorDefinition {
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) => `All values of '${property}' must be valid strings`
    validation = isStringArray
  } else {
    defaultMessage = (property: string) => `'${property}' must be a valid string.`
    validation = isString
  }

  return defineValidationDecorator(validation, { message: defaultMessage, ...options })
}
