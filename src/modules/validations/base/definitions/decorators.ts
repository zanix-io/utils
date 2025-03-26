// deno-lint-ignore-file no-explicit-any
import type { BaseRTO } from 'modules/validations/base/rto.ts'
import type {
  ValidationDecoratorDefinition,
  ValidationFunction,
  ValidationOptions,
} from 'typings/validations.ts'

import { defineInit, defineSetter } from './accessors.ts'
import validationsMetadata from 'modules/validations/base/metadata.ts'

/**
 * Creates an accessor decorator for validating property values.
 *
 * This function returns a decorator that applies the provided validation function
 * to a class property. If the validation fails, an error message (defined in `opts.message`)
 * can be thrown or logged.
 *
 * @param validation - A function that determines whether the value is valid.
 *                     It can return a boolean or a Promise<boolean> for async validation.
 * @param opts - An object containing validation options such as a custom error message.
 *
 * @returns An accessor decorator that applies the validation logic on property assignment.
 *
 * @example
 * ```ts
 * const MyOwnDecorator = ()=> defineValidationDecorator((val) => typeof val === 'string', { message: 'Must be a string' })
 * ```
 * @category validators
 */
export function defineValidationDecorator<T extends BaseRTO = BaseRTO>(
  validation: ValidationFunction<T>,
  opts: ValidationOptions = {},
) {
  if (opts.transform) opts.expose = true // If 'transform' is enabled, 'expose' is set to true by default.

  const { each, transform: currentTransform = (val: string) => val } = opts

  const transform = (value: any) =>
    each ? value.map((val: string) => currentTransform(val)) : currentTransform(value)

  const decorator: ValidationDecoratorDefinition = ({ set }, context) => {
    const property = context.name.toString()

    const { message = '' } = opts

    const messageResult = typeof message === 'string' ? () => message : message

    function customSetter(this: any, value: any) {
      const { asGetter } = validationsMetadata.getValidationSetup(this.constructor.prototype)
      if (!asGetter) {
        Object.defineProperty(this, property, {
          value,
          writable: true,
          enumerable: true,
        })
      }
      set.call(this, value)
    }

    return {
      set: defineSetter({
        property,
        messageResult,
        validation,
        originalSetter: customSetter,
        transform,
      }),
      init: defineInit(opts, { messageResult, property }),
    }
  }
  return decorator
}
