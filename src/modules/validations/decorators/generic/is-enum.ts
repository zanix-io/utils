import type { ValidationDecoratorDefinition, ValidationOptions } from 'typings/validations.ts'
import { defineValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'

type EnumType = Record<string, unknown> | unknown[]

function normalizeEnum(enumLike: EnumType): Record<string, unknown> {
  // If already an enum (object)
  if (!Array.isArray(enumLike)) return enumLike

  // Convert array → enum-like object
  const result: Record<string, unknown> = {}
  for (const item of enumLike) {
    result[item as string] = item
  }
  return result
}

/**
 * Checks if a value is a valid enum member.
 *
 * @param value
 * @param enumObj Enum object to validate against.
 * @returns {boolean}
 *
 * @category validations
 */
export function isEnum(value: unknown, enumObj: EnumType): boolean {
  const normalized = normalizeEnum(enumObj)
  return Object.values(normalized).includes(value)
}

/**
 * Checks if all values in an array are valid enum members.
 *
 * @param value
 * @param enumObj Enum object to validate against.
 * @returns {boolean}
 *
 * @category validations
 */
export function isEnumArray(
  value: unknown[],
  enumObj: Record<string, unknown> | unknown[],
): boolean {
  try {
    const normalized = normalizeEnum(enumObj)
    return value.every((val) => Object.values(normalized).includes(val))
  } catch {
    return false
  }
}

/**
 * Decorator to validate that a value belongs to a given enum.
 *
 * @param enumObj The enum object to validate against.
 * @param options Optional validation settings, including a custom error message.
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 * @category validations
 */
export const IsEnum = (
  validations: EnumType,
  options: ValidationOptions = {},
): ValidationDecoratorDefinition => {
  let validation
  let defaultMessage

  if (options.each) {
    validation = (value: unknown) => isEnumArray(value as unknown[], validations)
    defaultMessage = (property: string) => `All values of '${property}' must be valid enum members`
  } else {
    validation = (value: unknown) => isEnum(value, validations)
    defaultMessage = (property: string) => `'${property}' must be a valid enum member`
  }

  return defineValidationDecorator(validation, { message: defaultMessage, ...options })
}
