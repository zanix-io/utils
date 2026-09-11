import type {
  DefaultTransformValidationOpts,
  ValidationDecorator,
  ValidationDecoratorDefinition,
} from 'typings/validations.ts'

import { defineCatalogValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'
import { defaultTransform } from './defaults.ts'

/**
 * max age validation
 *
 * @param years
 * @param value
 * @returns {boolean}
 *
 * @category validations
 */
export function maxAge(years: number, value?: Date): boolean {
  if (!(value instanceof Date) || isNaN(value.getTime())) return false

  const threshold = new Date()
  threshold.setFullYear(threshold.getFullYear() - years)

  return value >= threshold
}

/**
 * max age validation for arrays.
 *
 * @param years
 * @param values
 * @returns {boolean}
 *
 * @category validations
 */
export function maxAgeArray(years: number, values: Date[]): boolean {
  try {
    const threshold = new Date()
    threshold.setFullYear(threshold.getFullYear() - years)

    return !values.some((val: Date) => !(val instanceof Date) || val < threshold)
  } catch {
    return false
  }
}

/**
 * Decorator to validate that a date is not far enough in the past to represent an age older than
 * the given number of years (e.g. a birth date implausibly old as of today).
 *
 * Unlike `MaxDate`/`MinDate`, whose threshold is a fixed `Date` the caller passes in (and which
 * therefore only stays current if re-evaluated, e.g. at module load time), `MaxAge`'s threshold
 * is derived from `years` and recomputed from `new Date()` on every single validation call — it
 * never drifts, no matter how long the process runs. The symmetric counterpart to `MinAge`.
 *
 * @param {number} years - The maximum number of years that may have elapsed since the date.
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 *  @example
 * Decorator use. (You don't need to use `expose` property here
 * ```ts
 *  ´@MaxAge(120, { message: 'That birth date implies an implausible age.' })
 *  accessor birthDate: Date
 * ```
 *
 * @category validations
 */
export const MaxAge: ValidationDecorator<
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
      `All values of '${property}' must represent an age of at most ${years} years.`
    validation = (value: Date[]) => maxAgeArray(years, value)
  } else {
    defaultMessage = (property: string) =>
      `'${property}' must represent an age of at most ${years} years.`
    validation = (value: Date) => maxAge(years, value)
  }

  return defineCatalogValidationDecorator(validation, {
    transform: defaultTransform(transform),
    message: defaultMessage,
    ...opts,
  }, { decorator: 'MaxAge', args: [years] })
}
