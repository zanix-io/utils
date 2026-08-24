// deno-lint-ignore-file no-explicit-any
import type { BaseRTO } from 'modules/validations/base/rto.ts'

/**
 * Callback function for message validation processor
 */
export type ValidationMessage = (
  property: string,
  value: any,
  target?: any,
) => string

/**
 * Defines the types for request data transfer objects (RTOs).
 * This generic type helps structure different parts of an HTTP request.
 *
 * @template B - Type for the request body, extending BaseRTO.
 * @template P - Type for the request parameters, extending BaseRTO.
 * @template S - Type for the query string parameters, extending BaseRTO.
 */
export type RtoTypes<
  B extends BaseRTO = BaseRTO,
  P extends BaseRTO = BaseRTO,
  S extends BaseRTO = BaseRTO,
> = {
  /**
   * Defines the RTO for the request body.
   * This should be a class constructor that extends BaseRTO.
   */
  Body?: new (...args: any[]) => B

  /**
   * Defines the RTO for the route parameters.
   * This should be a class constructor that extends BaseRTO.
   */
  Params?: new (...args: any[]) => P

  /**
   * Defines the RTO for the query string parameters.
   * This should be a class constructor that extends BaseRTO.
   */
  Search?: new (...args: any[]) => S
}

/**
 * Represents an error that occurs during validation.
 */
export interface ValidationError {
  /**
   * Object that was validated.
   */
  target: object

  /**
   * Object's property that haven't pass validation.
   */
  property: string

  /**
   * Formatted value that haven't pass a validation.
   */
  value: any

  /**
   * Plain value that haven't pass a validation.
   */
  plainValue?: any

  /**
   * Constraints that failed validation with error messages.
   */
  constraints: string[]

  /**
   * Contains all nested validation errors of the property.
   */
  children?: ValidationError[]
}

/**
 * Options for validation decorators.
 * Allows customization of validation messages.
 */
export type ValidationOptions = {
  /**
   * Custom error message to be thrown when validation fails.
   */
  message?: string | ValidationMessage
  /**
   * Specifies whether the validation error should apply to each individual item when validating an array, or to the whole value if it's a single item.
   */
  each?: boolean
  /**
   * Marks the validation as optional, but only if the value is `undefined`.
   * This does not apply to properties with default values or those defined in the constructor.
   *
   * If a property has a default value, this option is unnecessary, as it is optional by default.
   */
  optional?: boolean
  /**
   * Exposes ONLY the property without transformation logic.
   * This should be used similarly to the \@Expose decorator (please don't use together).
   */
  expose?: boolean
  /**
   * Returns transformed or formatted data.
   * By default, this option exposes the property (avoid using the `@Expose` decorator or expose option together).
   */
  transform?: (value?: string) => any
}

/** Validation options for decorators with a boolean-only `transform` flag. */
export type DefaultTransformValidationOpts =
  & Omit<ValidationOptions, 'transform' | 'expose'>
  & {
    /**
     * A flag indicating whether the value should be transformed into a validator type.
     * Defaults to `true`, meaning the value will be automatically converted to an specific type.
     * If set to `false`, value date will remain in its original format.
     *
     * @type {boolean}
     * @default true
     */
    transform?: boolean
  }

/**
 * Represents the subject of validation.
 * It can be any type since validations may apply to different data structures.
 */
export type ValidationConstraints<T extends any> = T

/**
 * Defines the function signature for validation logic.
 * The function receives a value and returns either a boolean (synchronous validation)
 * or a Promise<boolean> (asynchronous validation).
 */
export type ValidationFunction<T extends BaseRTO = BaseRTO> = (
  this: T,
  val: any,
  property: string,
) => Promise<boolean> | boolean

/**
 * Defines the structure of a validation decorator applied to a class accessor.
 *
 * @param value - Provides access to the original setter function for property manipulation.
 * @param context - Contains metadata about the class property, including its name and accessors.
 * @returns A modified accessor that enforces validation rules.
 */
export type ValidationDecoratorDefinition = (
  value: { set: (this: any, value: any) => void },
  context: ClassAccessorDecoratorContext,
) => ClassAccessorDecoratorResult<any, any>

/**
 * Type definition for a validation decorator function.
 *
 * @param subject - The target subject of validation (e.g., a class property).
 * @param options - Additional options for validation, such as a custom error message.
 * @returns A function that modifies the property accessor to enforce validation.
 */
export type ValidationDecorator<
  T extends any | any[] | undefined = undefined,
  Opts = ValidationOptions,
> = T extends undefined ? ((
    options?: Opts,
  ) => ValidationDecoratorDefinition)
  : ((
    validation: ValidationConstraints<T>,
    options?: Opts,
  ) => ValidationDecoratorDefinition)

/**
 * Identifies which validation decorator produced a given {@linkcode RTOFieldMetadata} entry,
 * plus any decorator-specific arguments it was called with beyond {@linkcode ValidationOptions}
 * (e.g. `IsEnum`'s allowed values).
 *
 * Passed by a decorator to `defineValidationDecorator`'s third argument. A custom decorator that
 * omits it still registers its field for {@linkcode RTOFieldMetadata} purposes, just without a
 * known `decorator` name.
 */
export type ClassFieldDecoratorMeta = {
  /** Name of the decorator applied, e.g. `'IsString'`, `'IsEnum'`. */
  decorator: string
  /** Decorator-specific arguments beyond `ValidationOptions`, e.g. `IsEnum`'s enum object/array. */
  args?: unknown[]
}

/**
 * One decorator's identity within a field's {@linkcode RTOFieldMetadata.decorators} stack —
 * the same `decorator`/`args` shape as the field-level entry, minus the field-wide
 * `each`/`optional`/`expose` flags that apply to the property as a whole rather than to a
 * single decorator.
 */
export type RTOFieldDecoratorEntry = {
  /** Name of this decorator (e.g. `'IsString'`, `'Length'`), `undefined` if it registered with no known name. */
  decorator?: string
  /** This decorator's own arguments beyond `ValidationOptions`. Empty when it takes none. */
  args: unknown[]
}

/**
 * Static, class-level description of a single `BaseRTO` field: which validation decorator was
 * applied, with what arguments, and its `each`/`optional`/`expose` flags — everything a
 * build-time consumer (an OpenAPI generator, a form/table renderer, ...) needs without
 * constructing or validating a real instance.
 */
export type RTOFieldMetadata = {
  /**
   * Name of the validation decorator applied (e.g. `'IsString'`, `'IsEnum'`). `undefined` for a
   * custom decorator that didn't register a name (built via `Validation()` or a raw
   * `defineValidationDecorator()` call with no third argument).
   *
   * When more than one decorator is stacked on the same field, this reflects only the
   * last-registered decorator — read {@linkcode RTOFieldMetadata.decorators} for the full stack.
   */
  decorator?: string
  /**
   * Decorator-specific arguments beyond `ValidationOptions`, e.g. `IsEnum`'s enum object/array.
   * Empty when the decorator takes none.
   *
   * When more than one decorator is stacked on the same field, this reflects only the
   * last-registered decorator — read {@linkcode RTOFieldMetadata.decorators} for the full stack.
   */
  args: unknown[]
  /**
   * Every validation decorator applied to this field, in registration order. Present only when
   * two or more decorators are stacked on the same property (e.g. `@IsString() @Length({ min: 1,
   * max: 100 })`) — a field with a single decorator omits this entirely, since `decorator`/`args`
   * above already describe it fully.
   *
   * `decorator`/`args` still mirror the last-registered decorator unchanged, so an existing
   * consumer that only reads those two fields keeps working identically; a consumer that wants
   * every constraint a stacked field enforces reads this instead.
   */
  decorators?: RTOFieldDecoratorEntry[]
  /** Whether the decorator validates each item of an array (`each: true`) rather than the whole value. */
  each: boolean
  /** Whether the field is optional. */
  optional: boolean
  /** Whether the field is exposed in the validated output. */
  expose: boolean
}

/**
 * Nested properties metadata types
 */
export type NestedProperties<K extends 'error' | 'obj'> = K extends 'error'
  ? { [key: string]: ValidationError[] }
  : { [key: string]: any }

/**
 * Validation setup context
 */
export type ValidationSetupCtx = {
  expose?: boolean
  context?: any
  asGetter?: boolean
  target: any
  whiteListCallback: (obj: any, plain: any) => void
}
