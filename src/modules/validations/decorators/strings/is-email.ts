import type { ValidationDecorator, ValidationDecoratorDefinition } from 'typings/validations.ts'

import { defineValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'
import { match, matchArray } from './match.ts'
import { emailRegex } from 'utils/regex.ts'

/**
 * Is email validation
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isEmail(value?: string): boolean {
  return match(emailRegex, value)
}

/**
 * Is email validation for arrays.
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isEmailArray(value: string[]): boolean {
  return matchArray(emailRegex, value)
}

/**
 * Decorator to validate that a value is a valid email address.
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 * @category validations
 */
export const IsEmail: ValidationDecorator = function (options = {}): ValidationDecoratorDefinition {
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) =>
      `All values of '${property}' must be valid email addresses.`
    validation = isEmailArray
  } else {
    defaultMessage = (property: string) => `'${property}' must be a valid email address.`
    validation = isEmail
  }

  return defineValidationDecorator(validation, { message: defaultMessage, ...options })
}
