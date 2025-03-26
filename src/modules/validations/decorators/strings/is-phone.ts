import type { ValidationDecorator, ValidationDecoratorDefinition } from 'typings/validations.ts'

import { defineValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'
import { match, matchArray } from './match.ts'
import { phoneRegex } from 'utils/regex.ts'

/**
 * Is phone validation
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isPhone(value?: string): boolean {
  return match(phoneRegex, value)
}

/**
 * Is phone validation for arrays.
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isPhoneArray(value: string[]): boolean {
  return matchArray(phoneRegex, value)
}

/**
 * Decorator to validate that a value is a valid Phone.
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 * @category validations
 */
export const IsPhone: ValidationDecorator = function (options = {}): ValidationDecoratorDefinition {
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) => `All values of '${property}' must be a valid phone`
    validation = isPhoneArray
  } else {
    defaultMessage = (property: string) => `'${property}' must be a valid phone.`
    validation = isPhone
  }

  return defineValidationDecorator(validation, { message: defaultMessage, ...options })
}
