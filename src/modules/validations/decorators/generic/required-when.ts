import type { BaseRTO } from '../../base/rto.ts'
import type {
  ValidationDecoratorDefinition,
  ValidationMessage,
  ValidationOptions,
} from 'typings/validations.ts'

import { defineCatalogValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'
import validationsMetadata from '../../base/metadata.ts'

/** A primitive the trigger field is compared with. */
export type RequiredWhenValue = string | number | boolean

/**
 * The condition under which a field is required: a primitive (the trigger field equals it), a
 * list of primitives (the trigger field equals one of them), or a predicate that receives the RTO
 * being validated.
 */
export type RequiredWhenCondition<T extends BaseRTO = BaseRTO> =
  | RequiredWhenValue
  | readonly RequiredWhenValue[]
  | ((instance: T) => boolean)

/** Options of {@linkcode RequiredWhen}: `optional` is implied by the condition, `expose` always on. */
export type RequiredWhenOptions = Omit<ValidationOptions, 'optional'>

const isPrimitive = (value: unknown): value is RequiredWhenValue =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'

/**
 * Compares the submitted value of the trigger field with an expected primitive. Both are compared
 * as strings, so `'5'` (what a form submits) and `5` (what a transforming decorator assigns)
 * match the same expectation, whichever of the two the trigger holds when the rule runs.
 */
const sameValue = (actual: unknown, expected: RequiredWhenValue) =>
  isPrimitive(actual) && String(actual) === String(expected)

const isFilledText = (value: unknown) => typeof value === 'string' && value.trim().length > 0

/**
 * Decorator that makes a string field required only when another field of the same RTO meets a
 * condition. When the condition holds, the field must be a string with at least one character
 * other than whitespace, and a missing key, `''` or a blank string is refused. When it does not
 * hold, a missing key, `''` or any string is accepted, and any other type is refused.
 *
 * It exists for multi-intent RTOs: one `Body` with a field (`intent`) that tells what was
 * submitted (`create`, `delete`, ...) where some fields are mandatory for one intent only. The
 * rule runs for a missing key too, and the errors of all the fields that fail are reported at
 * once, like the rest of the validator.
 *
 * The decorated field is always exposed (as with `expose: true`) and is never an `expose` error
 * when it is missing. `classMetadata` reports it as `optional: true` with `args: [key, when]`.
 *
 * The trigger field is read as submitted, so it works whatever the order of the keys in the
 * plain object and the order of the accessors in the class. When `when` is a primitive or a
 * list, the comparison is made as strings (`5` matches `'5'`). A predicate receives the instance
 * under validation: the fields it reads are the exposed ones (`expose: true`, or a decorator that
 * transforms), as submitted, or already transformed when their own validation has run. If the
 * trigger is missing or invalid, a primitive or a list never match, so no conditional field is
 * flagged and only the trigger itself reports an error.
 *
 * @param key Name of the trigger field of the same RTO.
 * @param when Condition on the trigger field: a primitive, a list of primitives, or a predicate.
 * @param options Optional validation settings: `message`, `each` (every item must be a filled
 * string) and `transform` (applied to the submitted value before the check).
 *
 * @returns {ValidationDecoratorDefinition} A decorator function.
 *
 * @example
 * ```ts
 * class AddressRTO extends BaseRTO {
 *   ´@IsEnum(['create', 'delete'], { expose: true })
 *   accessor intent!: 'create' | 'delete'
 *
 *   ´@RequiredWhen<AddressRTO>('intent', 'create', { message: 'Required to create' })
 *   accessor line1: string | undefined
 *
 *   ´@RequiredWhen<AddressRTO>('intent', ['create', 'update'])
 *   accessor city: string | undefined
 *
 *   ´@RequiredWhen<AddressRTO>('intent', (rto) => rto.intent !== 'delete')
 *   accessor phone: string | undefined
 * }
 * ```
 *
 * @category validations
 */
export const RequiredWhen = <T extends BaseRTO = BaseRTO>(
  key: keyof T & string,
  when: RequiredWhenCondition<T>,
  options: RequiredWhenOptions = {},
): ValidationDecoratorDefinition => {
  const { each } = options

  const isRequired = (rto: T): boolean => {
    if (typeof when === 'function') return !!when(rto)
    // `rto` carries the assigned and the exposed values; the plain payload covers a trigger that
    // is neither, so the rule never depends on whether the trigger was already handled.
    const actual = rto[key] ??
      validationsMetadata.getPlainPayload(rto.constructor.prototype)[key]
    return Array.isArray(when)
      ? when.some((expected) => sameValue(actual, expected))
      : sameValue(actual, when as RequiredWhenValue)
  }

  const isText = (value: unknown) => typeof value === 'string'

  function validation(this: T, value: unknown) {
    const required = isRequired(this)
    if (each) {
      if (value === undefined && !required) return true
      if (!Array.isArray(value)) return false
      return required ? value.length > 0 && value.every(isFilledText) : value.every(isText)
    }
    if (required) return isFilledText(value)
    return value === undefined || isText(value)
  }

  const defaultMessage: ValidationMessage = (property, value) => {
    const wellTyped = each ? Array.isArray(value) && value.every(isText) : isText(value)
    if (value !== undefined && !wellTyped) {
      return each
        ? `All values of '${property}' must be valid strings`
        : `'${property}' must be a valid string.`
    }
    return each
      ? `'${property}' is required and must have at least one non-blank string.`
      : `'${property}' is required.`
  }

  return defineCatalogValidationDecorator(
    validation,
    { message: defaultMessage, ...options, expose: true },
    { decorator: 'RequiredWhen', args: [key, when] },
    true,
  )
}
