import type {
  ValidationDecorator,
  ValidationDecoratorDefinition,
  ValidationOptions,
} from 'typings/validations.ts'

import { defineCatalogValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'

/**
 * Validate if has valid length
 *
 * @param value
 * @param min
 * @param max
 * @returns {boolean}
 *
 * @category validations
 */
export function arrayLength(
  value: unknown[],
  min: number,
  max: number,
): boolean {
  return Array.isArray(value) && min >= 1 && value.length >= min &&
    value.length <= max
}

/**
 * Decorator to validate that an array length between the specified min and max.
 * @param constraints The constraints
 *   - min: (Optional) The minimum allowed length. Defaults to `2`. Must be at least `1`;
 *     passing `0` makes the validation always fail, since arrays are expected to be non-empty.
 *   - max: (Optional) The maximum allowed length.
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 * @category validations
 */
export const ArrayLength: ValidationDecorator<
  { min?: number; max?: number },
  Omit<ValidationOptions, 'each'>
> = function (
  constraints,
  options = {},
): ValidationDecoratorDefinition {
  const { min = 2, max = Infinity } = constraints
  const defaultMessage = max === Infinity
    ? `at least ${min} elements.`
    : `a length between ${min} and ${max} elements.`

  const {
    message = (property) => `'${property}' must have ${defaultMessage}`,
    ...opts
  } = options

  const validation = (value: unknown[]) => arrayLength(value, min, max)
  return defineCatalogValidationDecorator(validation, { message, ...opts }, {
    decorator: 'ArrayLength',
    args: [{ min, max }],
  })
}
