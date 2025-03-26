import type {
  DefaultTransformValidationOpts,
  ValidationDecorator,
  ValidationDecoratorDefinition,
} from 'typings/validations.ts'

import { defineValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'
import { defaultTransform } from './defaults.ts'

/**
 * max number validation
 *
 * @param number
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function maxNumber(num: number, value?: number): boolean {
  return typeof value === 'number' && value <= num
}

/**
 * max number validation for arrays.
 *
 * @param number
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function maxNumberArray(num: number, values: number[]): boolean {
  try {
    return !values.some((val: number) => typeof val !== 'number' || val > num)
  } catch {
    return false
  }
}

/**
 * Decorator to validate that a number is not greater than the specified.
 * @param {number} num - The maximum allowed number.
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 *  @example
 * Decorator use. (You don't need to use `expose` property here
 * ```ts
 *  ´@MaxNumber(4, { optional: true })
 *  accessor value: number | undefined
 * ```
 * @category validations
 */
export const MaxNumber: ValidationDecorator<number, DefaultTransformValidationOpts> = function (
  num: number,
  options = {},
): ValidationDecoratorDefinition {
  const { transform = true, ...opts } = options
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) =>
      `All values of '${property}' must be numbers less or equal than ${num}.`
    validation = (value: number[]) => maxNumberArray(num, value)
  } else {
    defaultMessage = (property: string) =>
      `'${property}' must be a number less or equal than ${num}.`
    validation = (value: number) => maxNumber(num, value)
  }

  return defineValidationDecorator(validation, {
    transform: defaultTransform(transform),
    message: defaultMessage,
    ...opts,
  })
}
