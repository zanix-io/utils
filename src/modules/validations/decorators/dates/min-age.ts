import type {
  DefaultTransformValidationOpts,
  ValidationDecorator,
  ValidationDecoratorDefinition,
} from 'typings/validations.ts'

import { defineCatalogValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'
import { defaultTransform } from './defaults.ts'

/**
 * min age validation
 *
 * @param years
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function minAge(years: number, value?: Date): boolean {
  if (!(value instanceof Date) || isNaN(value.getTime())) return false

  const threshold = new Date()
  threshold.setFullYear(threshold.getFullYear() - years)

  return value <= threshold
}

/**
 * min age validation for arrays.
 *
 * @param years
 * @param values
 * @returns {boolean}
 *
 * @category validations
 */
export function minAgeArray(years: number, values: Date[]): boolean {
  try {
    const threshold = new Date()
    threshold.setFullYear(threshold.getFullYear() - years)

    return !values.some((val: Date) => !(val instanceof Date) || val > threshold)
  } catch {
    return false
  }
}

/**
 * Decorator to validate that a date is far enough in the past to represent an age of at least
 * the given number of years (e.g. a birth date old enough as of today).
 *
 * Unlike `MaxDate`/`MinDate`, whose threshold is a fixed `Date` the caller passes in (and which
 * therefore only stays current if re-evaluated, e.g. at module load time), `MinAge`'s threshold
 * is derived from `years` and recomputed from `new Date()` on every single validation call — it
 * never drifts, no matter how long the process runs.
 *
 * @param {number} years - The minimum number of years that must have elapsed since the date.
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 *  @example
 * Decorator use. (You don't need to use `expose` property here
 * ```ts
 *  ´@MinAge(18, { message: 'You must be at least 18 years old.' })
 *  accessor birthDate: Date
 * ```
 *
 * @category validations
 */
export const MinAge: ValidationDecorator<
  number,
  DefaultTransformValidationOpts
> = function (
  years: number,
  options = {},
): ValidationDecoratorDefinition {
  const { transform = true, ...opts } = options
  let defaultMessage
  let validation

  if (options.each) {
    defaultMessage = (property: string) =>
      `All values of '${property}' must represent an age of at least ${years} years.`
    validation = (value: Date[]) => minAgeArray(years, value)
  } else {
    defaultMessage = (property: string) =>
      `'${property}' must represent an age of at least ${years} years.`
    validation = (value: Date) => minAge(years, value)
  }

  return defineCatalogValidationDecorator(validation, {
    transform: defaultTransform(transform),
    message: defaultMessage,
    ...opts,
  }, { decorator: 'MinAge', args: [years] })
}
