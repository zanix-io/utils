// deno-lint-ignore-file no-explicit-any
import type { RTOFieldMetadata, ValidationError } from 'typings/validations.ts'
import type { BaseRTO } from './base/rto.ts'

import validationsMetadata from './base/metadata.ts'
import { resolveClassFields } from './base/definitions/class-fields.ts'
import { errorValidationFormatting } from './errors.ts'
import { HttpError } from 'modules/errors/main.ts'
import { validate } from './verifier.ts'

/**
 * Validates a plain object against a given Request Transfer Object (RTO) class.
 *
 * This function creates an instance of the specified RTO class and applies validation
 * rules to ensure the provided `plainObject` conforms to the expected structure.
 * It supports automatic property filtering via the `excludeExtraneousValues` option.
 *
 * @template T - The type of the Request Transfer Object (RTO).
 * @param RTO - The class constructor of the RTO that defines validation rules.
 * @param plainObject - The raw object to be validated and transformed.
 * @param options The class validator Options.
 *  -  [excludeExtraneousValues=true] -  If `false`, assigns all unassigned properties from the `plainObject` to `RTO`.
 *  -  [exposeDefaultsValues=true] -  If `false`, `RTO` default values are not exposed during initialization, even if the `Expose` decorator is used.
 *  -  `throwErrors`- A function that takes an array of ValidationError objects as an argument.
 *     It is used to process or throw the validation errors as needed.
 *  -  `ctx` - Context object to inject to the class
 *
 * @returns A promise that resolves to an instance of `T` if validation succeeds.
 *
 * @throws Will throw errors if there are validation issues.
 *
 * @example
 * ```ts
 * const userData = { name: "John", email: "john@example.com" };
 * const validatedUser = await classValidation(UserRTO, userData, { whitelist: true });
 * console.log(validatedUser); // Instance of UserRTO with validated properties
 * ```
 *
 * @category validators
 */
export async function classValidation<T extends BaseRTO>(
  RTO: new (data: any) => T,
  plainObject: any,
  options: {
    /** Context object to inject to the class */
    ctx?: any
    /** If `false`, assigns all unassigned properties from the `plainObject` to `RTO`. Defaults `true` */
    excludeExtraneousValues?: boolean
    /** If `false`, `RTO` default values are not exposed during initialization, even if the `Expose` decorator is used. Defaults `true` */
    exposeDefaultsValues?: boolean
    /**
     * This property determines whether the values should be exposed as getters.
     *
     * By default, this property is set to `false`, meaning the values are not exposed as getters.
     * It is not recommended to set this property to `true` when dealing with nested objects, as it might
     * interfere with object serialization, transformation, or validation processes.
     */
    exposeValuesAsGetter?: boolean
    /** A function that takes an array of ValidationError objects as an argument. */
    throwErrors?: (errors: ValidationError[]) => void
  } = {},
): Promise<T> {
  const {
    excludeExtraneousValues = true,
    exposeDefaultsValues = true,
    exposeValuesAsGetter = false,
    ctx = {},
  } = options

  const whiteListCallback = excludeExtraneousValues ? () => {} : (obj: any, plain: any) => {
    for (const key in plain) {
      if (obj[key] === undefined) obj[key] = plain[key]
    }
  }

  const setup = {
    expose: exposeDefaultsValues,
    asGetter: exposeValuesAsGetter,
    context: ctx,
    whiteListCallback,
    target: RTO.prototype,
  }

  const { errors, obj } = await validate(RTO, plainObject, setup)

  const throwErrors = options.throwErrors || ((
    errors: ValidationError[],
  ) => {
    throw new HttpError('BAD_REQUEST', {
      cause: {
        message: 'Request validation error',
        properties: errorValidationFormatting(errors),
        target: obj.constructor.name,
      },
      // Unlike most `cause` values (typically another system's raw, internal error), this one is
      // purpose-built per-field feedback about the caller's OWN submitted data — exactly the case
      // `exposeCause` exists for: safe and directly actionable for whoever gets this response, not
      // internal-only detail. See `@zanix/errors`' `ErrorOptions.exposeCause` doc.
      exposeCause: true,
    })
  })

  validationsMetadata.resetAll(obj) // Delete current obj metadata

  if (errors.length) throwErrors(errors)

  return obj
}

/**
 * Returns the static field metadata for a `BaseRTO` subclass: which validation decorator each
 * accessor uses, with what arguments, and its `each`/`optional`/`expose` flags — derived purely
 * from the class itself, with no instance to construct and no plain object to validate.
 *
 * Where `classValidation` runs the validation pipeline against real data, `classMetadata`
 * introspects the class definition — the piece a build-time consumer (an OpenAPI generator, a
 * form/table renderer, ...) needs.
 *
 * Fields declared on a parent `BaseRTO` class are included for a subclass that extends it
 * (merged base-first, so a field the subclass redeclares overrides the parent's entry).
 *
 * A field carrying two or more stacked decorators (e.g. `@IsString() @Length({ min: 1, max: 100
 * })`) reports its `decorator`/`args` as only the last-registered decorator, plus a `decorators`
 * array listing every decorator in the stack — read that array to see every constraint the field
 * actually enforces.
 *
 * `ValidateNested(NestedRTO)`'s entry carries `args: [NestedRTO]` — a real, directly usable
 * `BaseRTO` subclass constructor, not serialized data. A consumer that needs the nested class's
 * own field shape calls `classMetadata(NestedRTO)` recursively; one that needs to serialize this
 * output (e.g. `JSON.stringify` across a subprocess boundary) must resolve that nested class
 * itself first, since a live constructor doesn't survive serialization.
 *
 * @template T - The `BaseRTO` subclass to introspect.
 * @param RTO - The class constructor of the RTO to introspect.
 *
 * @example
 * ```ts
 * class UserRTO extends BaseRTO {
 *   ´@IsString({ expose: true })
 *   accessor name!: string
 *
 *   ´@IsEnum(['admin', 'user'], { expose: true, optional: true })
 *   accessor role!: string
 * }
 *
 * classMetadata(UserRTO)
 * // {
 * //   name: { decorator: 'IsString', args: [], each: false, optional: false, expose: true },
 * //   role: { decorator: 'IsEnum', args: [['admin', 'user']], each: false, optional: true, expose: true },
 * // }
 * ```
 *
 * @category validators
 */
export function classMetadata<T extends BaseRTO>(
  RTO: new (...args: any[]) => T,
): Record<string, RTOFieldMetadata> {
  return resolveClassFields(RTO)
}
