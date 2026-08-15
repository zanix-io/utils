import type { ValidationDecorator, ValidationDecoratorDefinition } from 'typings/validations.ts'

import { defineValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'

/**
 * Is boolean validation
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isBoolean(value?: boolean): boolean {
  return value === true || value === false
}

/**
 * Is boolean validation for arrays.
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isBooleanArray(value: boolean[]): boolean {
  return value.every((v) => v === true || v === false)
}

/**
 * Decorator to validate that a value is boolean.
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 * @category validations
 */
export const IsBoolean: ValidationDecorator = function (
  options = {},
): ValidationDecoratorDefinition {
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) => `All values of '${property}' must be a boolean`
    validation = isBooleanArray
  } else {
    defaultMessage = (property: string) => `'${property}' must be a boolean.`
    validation = isBoolean
  }

  return defineValidationDecorator(validation, {
    message: defaultMessage,
    ...options,
  })
}
