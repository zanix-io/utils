import type { ValidationDecorator, ValidationDecoratorDefinition } from 'typings/validations.ts'

import { defineCatalogValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'
import { match, matchArray } from './match.ts'
import { URL_REGEX } from 'utils/regex.ts'

/**
 * Is url validation
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isUrl(value?: string): boolean {
  return match(URL_REGEX, value)
}

/**
 * Is url validation for arrays.
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isUrlArray(value: string[]): boolean {
  return matchArray(URL_REGEX, value)
}

/**
 * Decorator to validate that a value is a valid URL.
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 * @category validations
 */
export const IsUrl: ValidationDecorator = function (
  options = {},
): ValidationDecoratorDefinition {
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) => `All values of '${property}' must be a valid URL`
    validation = isUrlArray
  } else {
    defaultMessage = (property: string) => `'${property}' must be a valid URL.`
    validation = isUrl
  }

  return defineCatalogValidationDecorator(validation, {
    message: defaultMessage,
    ...options,
  }, { decorator: 'IsUrl' })
}
