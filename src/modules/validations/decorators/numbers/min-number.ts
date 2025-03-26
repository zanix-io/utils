import type {
  DefaultTransformValidationOpts,
  ValidationDecorator,
  ValidationDecoratorDefinition,
} from 'typings/validations.ts'

import { defineValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'
import { defaultTransform } from './defaults.ts'

/**
 * min number validation
 *
 * @param number
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function minNumber(num: number, value?: number): boolean {
  return typeof value === 'number' && value >= num
}

/**
 * min number validation for arrays.
 *
 * @param number
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function minNumberArray(num: number, values: number[]): boolean {
  try {
    return !values.some((val: number) => typeof val !== 'number' || val < num)
  } catch {
    return false
  }
}

/**
 * Decorator to validate that a number is not less than the specified.
 * @param {number} num - The minimum allowed number.
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 * @example
 * Decorator use. (You don't need to use `expose` property here
 * ```ts
 *  ´@MinNumber(4, { optional: true })
 *  accessor value: number | undefined
 * ```
 * @category validations
 */
export const MinNumber: ValidationDecorator<number, DefaultTransformValidationOpts> = function (
  num: number,
  options = {},
): ValidationDecoratorDefinition {
  const { transform = true, ...opts } = options
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) =>
      `All values of '${property}' must be numbers greater or equal than ${num}.`
    validation = (value: number[]) => minNumberArray(num, value)
  } else {
    defaultMessage = (property: string) =>
      `'${property}' must be a number greater or equal than ${num}.`
    validation = (value: number) => minNumber(num, value)
  }

  return defineValidationDecorator(validation, {
    transform: defaultTransform(transform),
    message: defaultMessage,
    ...opts,
  })
}
