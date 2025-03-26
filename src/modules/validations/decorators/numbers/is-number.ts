import type {
  DefaultTransformValidationOpts,
  ValidationDecorator,
  ValidationDecoratorDefinition,
} from 'typings/validations.ts'

import { defineValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'
import { defaultTransform } from './defaults.ts'

/**
 * is number validation
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isNumber(value?: number): boolean {
  return typeof value === 'number'
}

/**
 * is number validation for arrays.
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isNumberArray(values: number[]): boolean {
  try {
    return !values.some((val) => typeof val !== 'number')
  } catch {
    return false
  }
}

/**
 * Decorator to validate that a value is a valid number.
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 * @example
 * Decorator use. (You don't need to use `expose` property here
 * ```ts
 *  ´@IsNumber()
 *  accessor value: number = 2
 * ```
 *
 * @category validations
 */
export const IsNumber: ValidationDecorator<undefined, DefaultTransformValidationOpts> = function (
  options = {},
): ValidationDecoratorDefinition {
  const { transform = true, ...opts } = options
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) => `All values of '${property}' must be numerics.`
    validation = isNumberArray
  } else {
    defaultMessage = (property: string) => `'${property}' must be a valid number.`
    validation = isNumber
  }

  return defineValidationDecorator(validation, {
    transform: defaultTransform(transform),
    message: defaultMessage,
    ...opts,
  })
}
