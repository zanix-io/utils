import type {
  DefaultTransformValidationOpts,
  ValidationDecorator,
  ValidationDecoratorDefinition,
} from 'typings/validations.ts'

import { defineValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'
import { defaultTransform } from './defaults.ts'

/**
 * max date validation
 *
 * @param date
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function maxDate(date: Date, value?: Date): boolean {
  return value instanceof Date && value <= date
}

/**
 * max date validation for arrays.
 *
 * @param date
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function maxDateArray(date: Date, values: Date[]): boolean {
  try {
    return !values.some((val: Date) => !(val instanceof Date) || val > date)
  } catch {
    return false
  }
}

/**
 * Decorator to validate that a date is not later than the specified date.
 * @param {Date} date - The maximum allowed date.
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 *  @example
 * Decorator use. (You don't need to use `expose` property here
 * ```ts
 *  ´@MaxDate(new Date('2020-01-01'), { optional: true })
 *  accessor value: Date | undefined
 * ```
 *
 * @category validations
 */
export const MaxDate: ValidationDecorator<Date, DefaultTransformValidationOpts> = function (
  date: Date,
  options = {},
): ValidationDecoratorDefinition {
  const { transform = true, ...opts } = options
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) =>
      `All values of '${property}' must be Dates earlier than ${date.toISOString()}.`
    validation = (value: Date[]) => maxDateArray(date, value)
  } else {
    defaultMessage = (property: string) =>
      `'${property}' must be a Date earlier than ${date.toISOString()}.`
    validation = (value: Date) => maxDate(date, value)
  }

  return defineValidationDecorator(validation, {
    transform: defaultTransform(transform),
    message: defaultMessage,
    ...opts,
  })
}
