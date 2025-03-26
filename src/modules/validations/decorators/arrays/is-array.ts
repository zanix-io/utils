import type { ValidationDecorator, ValidationDecoratorDefinition } from 'typings/validations.ts'

import { defineValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'

/**
 * Is array validation
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isArray(value?: unknown[]): boolean {
  return Array.isArray(value)
}

/**
 * Is array of arrays validation
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isArrayOfArray(value: unknown[][]): boolean {
  try {
    return !(Array.isArray(value) ? value : [value]).some((val) => !Array.isArray(val))
  } catch {
    return false
  }
}

/**
 * Decorator to validate that a value is an array.
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 * @category validations
 */
export const IsArray: ValidationDecorator = function (options = {}): ValidationDecoratorDefinition {
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) => `All values of '${property}' must be arrays`
    validation = isArrayOfArray
  } else {
    defaultMessage = (property: string) => `'${property}' must be a an array.`
    validation = isArray
  }

  return defineValidationDecorator(validation, { message: defaultMessage, ...options })
}
