// deno-lint-ignore-file no-explicit-any
import type { BaseRTO } from 'modules/validations/base/rto.ts'
import type {
  ClassFieldDecoratorMeta,
  ValidationDecoratorDefinition,
  ValidationFunction,
  ValidationOptions,
} from 'typings/validations.ts'

import { defineInit, defineSetter } from './accessors.ts'
import { registerClassField } from './class-fields.ts'
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
  /**
   * Identifies the decorator for `classMetadata`'s class-level introspection (e.g.
   * `{ decorator: 'IsEnum', args: [allowedValues] }`). Optional — a custom decorator that omits
   * it still registers its field, just without a known `decorator` name.
   */
  meta: ClassFieldDecoratorMeta | undefined = undefined,
): ValidationDecoratorDefinition {
  if (opts.transform) opts.expose = true // If 'transform' is enabled, 'expose' is set to true by default.

  const { each, transform: currentTransform = (val: string) => val } = opts

  const transform = (value: any) =>
    each ? value.map((val: string) => currentTransform(val)) : currentTransform(value)

  const decorator: ValidationDecoratorDefinition = ({ set }, context) => {
    const property = context.name.toString()

    registerClassField(context, property, opts, meta)

    const { message = '' } = opts

    const messageResult = typeof message === 'string' ? () => message : message

    function customSetter(this: any, value: any) {
      const { asGetter } = validationsMetadata.getValidationSetup(
        this.constructor.prototype,
      )
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

/**
 * Internal-only variant of {@link defineValidationDecorator} for every decorator in this
 * package's own `IsX` catalog (`modules/validations/decorators/**`, e.g. `IsString`, `IsEmail`,
 * `MinDate`) — `meta` is REQUIRED here, unlike the public function, so a catalog decorator that
 * forgets to identify itself fails `deno check`/`deno publish` immediately instead of silently
 * producing an untagged `RTOFieldMetadata` entry (the exact gap
 * https://github.com/zanix-io/utils/issues/11 reported: `classMetadata`/OpenAPI generation can't
 * recognize a field's decorator without it).
 *
 * Never exported from `mod.ts`. A consumer building a fully custom decorator via the public
 * `defineValidationDecorator` (or this package's own `Validation()` helper) legitimately has no
 * fixed `decorator` name to give, and must keep using that one instead — this only tightens the
 * requirement for decorators shipped as part of this package's own known catalog.
 */
export function defineCatalogValidationDecorator<T extends BaseRTO = BaseRTO>(
  validation: ValidationFunction<T>,
  opts: ValidationOptions,
  meta: ClassFieldDecoratorMeta,
): ValidationDecoratorDefinition {
  return defineValidationDecorator(validation, opts, meta)
}
