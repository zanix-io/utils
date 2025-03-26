// deno-lint-ignore-file no-explicit-any
import type { ValidationError } from 'typings/validations.ts'
import type { BaseRTO } from './base/rto.ts'

import validationsMetadata from './base/metadata.ts'
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
    })
  })

  validationsMetadata.resetAll(obj) // Delete current obj metadata

  if (errors.length) throwErrors(errors)

  return obj
}
