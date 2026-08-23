import type { ValidationDecorator, ValidationDecoratorDefinition } from 'typings/validations.ts'

import { defineCatalogValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'
import { match, matchArray } from './match.ts'
import { OBJECT_ID_REGEX } from 'utils/regex.ts'

/**
 * Is object id validation
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isObjectId(value?: string): boolean {
  return match(OBJECT_ID_REGEX, value)
}

/**
 * Is object id validation for arrays.
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isObjectIdArray(value: string[]): boolean {
  return matchArray(OBJECT_ID_REGEX, value)
}

/**
 * Decorator to validate that a value is a MongoDB ObjectId (a 24-character hexadecimal string).
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 * @category validations
 */
export const IsObjectID: ValidationDecorator = function (
  options = {},
): ValidationDecoratorDefinition {
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) => `All values of '${property}' must be a valid ObjectIDs`
    validation = isObjectIdArray
  } else {
    defaultMessage = (property: string) => `'${property}' must be a valid ObjectID.`
    validation = isObjectId
  }

  return defineCatalogValidationDecorator(validation, {
    message: defaultMessage,
    ...options,
  }, { decorator: 'IsObjectID' })
}
