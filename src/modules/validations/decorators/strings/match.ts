import type { ValidationDecorator } from 'typings/validations.ts'

import { defineValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'

/**
 * Regexp match validation
 *
 * @param {RegExp} regex
 * @param value
 *
 * @returns {boolean}
 *
 * @category validations
 */
export function match(regex: RegExp, value?: string): boolean {
  return typeof value === 'string' && regex.test(value)
}

/**
 * Regexp match validation for arrays.
 *
 * @param {RegExp} regex
 * @param value
 *
 * @returns {boolean}
 *
 * @category validations
 */
export function matchArray(regex: RegExp, values: string[]): boolean {
  try {
    return !values.some((val) => (typeof val !== 'string' || !regex.test(val)))
  } catch {
    return false
  }
}

/**
 * Decorator to validate if a string matches a given regular expression pattern.
 * @param pattern The regular expression to match.
 * @param options Optional validation settings, including a custom error message.
 * @returns A decorator function that validates the property.
 *
 * @category validations
 */
export const Match: ValidationDecorator<RegExp> = function (regex, options = {}) {
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) =>
      `All values of '${property}' must match with regex ${regex}`
    validation = (value: string[]) => matchArray(regex, value)
  } else {
    defaultMessage = (property: string) => `'${property}' does not match with regex ${regex}`
    validation = (value: string) => match(regex, value)
  }

  return defineValidationDecorator(validation, { message: defaultMessage, ...options })
}
