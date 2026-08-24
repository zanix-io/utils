import type { ValidationDecorator, ValidationDecoratorDefinition } from 'typings/validations.ts'

import { defineCatalogValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'
import { match, matchArray } from './match.ts'
import { UUID_REGEX } from 'utils/regex.ts'

/**
 * Is uuid validation
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isUUID(value?: string): boolean {
  return match(UUID_REGEX, value)
}

/**
 * Is uuid validation for arrays.
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isUUIDArray(value: string[]): boolean {
  return matchArray(UUID_REGEX, value)
}

/**
 * Decorator to validate that a value is a UUID.
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 * @category validations
 */
export const IsUUID: ValidationDecorator = function (
  options = {},
): ValidationDecoratorDefinition {
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) => `All values of '${property}' must be a valid UUIDs`
    validation = isUUIDArray
  } else {
    defaultMessage = (property: string) => `'${property}' must be a valid UUID.`
    validation = isUUID
  }

  return defineCatalogValidationDecorator(validation, {
    message: defaultMessage,
    ...options,
  }, { decorator: 'IsUUID' })
}
