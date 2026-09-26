import type { ValidationDecorator, ValidationDecoratorDefinition } from 'typings/validations.ts'

import { defineCatalogValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'

/**
 * Is object validation.
 *
 * Accepts a plain object literal or a class instance: `typeof value === 'object'`,
 * excluding `null` and arrays (`typeof [] === 'object'` and `typeof null === 'object'`
 * in JavaScript, so both are rejected explicitly instead of passing through). Does not
 * validate the object's shape — use this to confirm a field is a JSON object at all
 * (e.g. a `Record<string, unknown>` with keys checked elsewhere), not what it contains.
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isObject(value?: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Is object validation for arrays.
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isObjectArray(value: unknown[]): boolean {
  return value.every((v) => isObject(v))
}

/**
 * Decorator to validate that a value is a plain object (not `null`, not an array).
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 * @category validations
 */
export const IsObject: ValidationDecorator = function (
  options = {},
): ValidationDecoratorDefinition {
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) => `All values of '${property}' must be an object`
    validation = isObjectArray
  } else {
    defaultMessage = (property: string) => `'${property}' must be an object.`
    validation = isObject
  }

  return defineCatalogValidationDecorator(validation, {
    message: defaultMessage,
    ...options,
  }, { decorator: 'IsObject' })
}
