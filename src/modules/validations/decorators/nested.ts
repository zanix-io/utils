import type { BaseRTO } from 'modules/validations/mod.ts'
import type { ValidationMessage } from 'typings/validations.ts'
import type {
  ValidationDecorator,
  ValidationDecoratorDefinition,
  ValidationError,
  ValidationFunction,
  ValidationOptions,
} from 'modules/types/mod.ts'

import { defineCatalogValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'
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
 * `classMetadata`'s entry for a `ValidateNested` field carries `args: [Type]` — the real `Type`
 * constructor passed here, not serialized data. Call `classMetadata(Type)` on it directly to
 * introspect the nested class's own fields; a consumer that needs to serialize `classMetadata`'s
 * output (e.g. across a subprocess boundary via `JSON.stringify`) must resolve this nested class
 * itself first, since a live constructor doesn't survive serialization.
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
  const defaultMessage: ValidationMessage = (property, _, target) => {
    return `Nested property '${property}' from target '${target.constructor.name}' must be follow validation rules.`
  }

  const validation: ValidationFunction = async function (val, property) {
    const setup = validationsMetadata.getValidationSetup(
      this.constructor.prototype,
    )
    const nestedObject = validationsMetadata.getNestedProperties(
      setup.target,
      'obj',
    )
    const nestedErrors = validationsMetadata.getNestedProperties(
      setup.target,
      'error',
    )

    const validateFn = async (
      value: object | undefined,
      setNestedError: (errors: ValidationError[]) => void,
      setNestedObj: (obj: unknown) => void,
    ) => {
      if (value === undefined && !options.optional) {
        setNestedError([{
          constraints: [
            `The '${property}' property must be defined.`,
          ],
          target: Type.prototype,
          property,
          value: undefined,
          plainValue: undefined,
        }])
        return false
      }
      const { errors, obj } = await validate(
        Type as never,
        { ...value },
        setup,
      )

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

  return defineCatalogValidationDecorator(validation, {
    message: defaultMessage,
    expose: true,
    ...options,
  }, { decorator: 'ValidateNested', args: [Type] })
}
