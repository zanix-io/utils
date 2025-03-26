import type { BaseRTO } from 'modules/validations/mod.ts'
import type {
  ValidationDecorator,
  ValidationDecoratorDefinition,
  ValidationError,
  ValidationFunction,
  ValidationOptions,
} from 'modules/types/mod.ts'

import { defineValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'
import validationsMetadata from 'modules/validations/base/metadata.ts'
import { validate } from '../verifier.ts'

/**
 * Validates nested objects within an RTO (Request Transfer Object).
 *
 * @param RTO - The class representing the nested object structure.
 * @param options - Validation options excluding `transform` and `expose`.
 * @returns A validation decorator for nested objects.
 *
 * **Considerations**: When using nested validations, default values are not validated because they are defined by code.
 * The types must be explicitly restricted. E.g:
 * ```ts
 * accessor nestedObj: Type = new Type({ someValue: 3 }); // Assuming Type as RTO Object
 * ```
 * `someValue` will not be validated by decorators because it is set directly by the code.
 *
 * @category Validations
 */
export const ValidateNested: ValidationDecorator<
  new (data: never) => BaseRTO,
  Omit<ValidationOptions, 'transform' | 'expose'>
> = function (
  Type,
  options = {},
): ValidationDecoratorDefinition {
  const defaultMessage = (property: string, value: string) => {
    if (value === undefined && !options.optional) {
      return `The '${property}' nested property must be defined when validate. To make it optional, set the corresponding option to true.`
    } else {
      return `Nested property '${property}' from target '${Type.name}' must be follow validation rules.`
    }
  }

  const validation: ValidationFunction = async function (val, property) {
    const setup = validationsMetadata.getValidationSetup(this.constructor.prototype)
    const nestedObject = validationsMetadata.getNestedProperties(setup.target, 'obj')
    const nestedErrors = validationsMetadata.getNestedProperties(setup.target, 'error')

    const validateFn = async (
      value: object | undefined,
      setNestedError: (errors: ValidationError[]) => void,
      setNestedObj: (obj: unknown) => void,
    ) => {
      const { errors, obj } = await validate(Type as never, { ...value }, setup)

      // Delete obj metadata
      validationsMetadata.resetAll(obj)
      delete obj['context' as never]

      if (errors.length) {
        setNestedError(errors)
        return false
      }

      setNestedObj(obj)

      return true
    }

    if (Array.isArray(val)) {
      const setNestedError = (errors: ValidationError[]) => {
        const nested = nestedErrors[property]
        if (nested) nested.push(...errors)
        else nestedErrors[property] = errors
      }
      const setNestedObj = (obj: unknown) => {
        const nested = nestedObject[property]
        if (nested) nested.push(obj)
        else nestedObject[property] = [obj]
      }
      const arrayValidations = await Promise.all(
        val.map((value) => validateFn(value, setNestedError, setNestedObj)),
      )

      return !arrayValidations.some((response) => response === false)
    }

    return validateFn(
      val,
      (errors) => nestedErrors[property] = errors,
      (obj) => nestedObject[property] = obj,
    )
  }

  return defineValidationDecorator(validation, {
    message: defaultMessage,
    expose: true,
    ...options,
  })
}
