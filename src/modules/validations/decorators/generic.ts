import type { BaseRTO } from '../base/rto.ts'
import type {
  ValidationDecoratorDefinition,
  ValidationFunction,
  ValidationOptions,
} from 'typings/validations.ts'

import { defineValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'

/**
 * A decorator function designed to expose accessor properties that are not defined in
 * the constructor, do not require validation, and do not involve setters or formatters.
 *
 * This decorator is intended for properties that should be publicly accessible without
 * the need for additional logic, such as validation, transformation, or formatting (e.g., setters or formatters).
 * It should only be applied when the property does not involve any logic beyond basic access.
 *
 * @param options Optional validation settings, including optional and a custom error message.
 *
 * @example
 *
 * Use \@Expose() in this scenarios
 * ```ts
 * export class B extends BaseRTO {
 *   constructor(data: B) {
 *     super()
 *     this.age = data.age // Assigns the age property from the provided data
 *   }
 *
 *   ´@Expose() // Exposes the defaulted (optional) property without transformation logic, making it required.
 *   ´@IsString() // You can omit `@Expose()` and use the `expose` property instead.
 *   accessor value: string | undefined // Do not set a default value if using `@Expose()` here. You can set defaults if using `expose` as a property.
 *
 *   ´@Expose() // Exposes the property without validation or transformation logic
 *   accessor test!: string
 *
 *   ´@Expose() // Exposes the defaulted property with transformation logic but without validation. It remains optional.
 *   accessor age: number = 3
 *
 *   ´@Expose({ optional: true }) // Exposes optional properties without validation or transformation
 *   accessor optionalValue: number | undefined;
 *
 * }
 * ```
 *
 * You won't need to use  \@Expose() in this scenarios:
 *  - When using Date and Number decorators (`IsNumber`, `MaxNumber`, `IsDate`, etc.), as they already include transformation logic.
 *  - When using `ValidateNested` decorator, already include transformation logic.
 *  - When the 'transform' property is set on the accessor decorator.
 *  - When any transformation logic is applied within the constructor initialization for accessors that use it.
 *  - When the 'expose' property is explicitly set on the accessor decorator.
 *
 * Note:  If you use another validator decorator, prefer setting `expose` as a property.
 *
 * @decorator
 *
 * @category validations
 */
export const Expose = function (
  options?: Pick<ValidationOptions, 'message' | 'optional' | 'transform'>,
): ValidationDecoratorDefinition {
  const defaultMessage = (property: string) => `The '${property}' property must be defined.`
  return defineValidationDecorator(() => true, {
    expose: true,
    message: defaultMessage,
    ...options,
  })
}

/**
 * A decorator to apply a specific validation function with optional settings.
 * This decorator allows associating a custom validation logic with a target property or method.
 *
 * @param validation The validation function that will be applied.
 * @param options Optional settings to customize the validation behavior (e.g., error messages, conditions, etc.).
 *
 * @returns A decorator definition that applies the validation logic to the target.
 *
 * @category validations
 */
export function Validation<T extends BaseRTO = BaseRTO>(
  validation: ValidationFunction<T>,
  options: ValidationOptions = {},
): ValidationDecoratorDefinition {
  const defaultMessage = options.each
    ? (property: string) => `All values of '${property}' must be follow validation rules.`
    : (property: string) => `'${property}' must be follow validation rules.`

  return defineValidationDecorator(validation, { message: defaultMessage, ...options })
}
