import type {
  DefaultTransformValidationOpts,
  ValidationDecorator,
  ValidationDecoratorDefinition,
} from 'typings/validations.ts'

import { defineValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'
import { defaultTransform } from './defaults.ts'

/**
 * is date validation
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isDate(value?: Date): boolean {
  return value instanceof Date && value.toString() !== 'Invalid Date'
}

/**
 * is date validation for arrays.
 *
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function isDateArray(values: Date[]): boolean {
  try {
    return !values.some((val) => !(val instanceof Date) || val.toString() === 'Invalid Date')
  } catch {
    return false
  }
}

/**
 * Decorator to validate that a value is a valid Date object.
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 * @example
 * Decorator use. (You don't need to use `expose` property here
 * ```ts
 *  ´@IsDate()
 *  accessor date1: Date = new Date()
 *
 *  ´@IsDate()
 *  accessor date2!: Date

 *  ´@IsDate({ transform: false })
 *  accessor date3: Date
 *
 *  ´@IsDate({ each: true, optional: true })
 *  accessor date4: Date[] | undefined
 *
 * ```
 *
 * @category validations
 */

export const IsDate: ValidationDecorator<undefined, DefaultTransformValidationOpts> = function (
  options = {},
): ValidationDecoratorDefinition {
  const { transform = true, ...opts } = options
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) => `All values of '${property}' must be valid Date objects`
    validation = isDateArray
  } else {
    defaultMessage = (property: string) => `'${property}' must be a valid Date object.`
    validation = isDate
  }

  return defineValidationDecorator(validation, {
    transform: defaultTransform(transform),
    message: defaultMessage,
    ...opts,
  })
}
