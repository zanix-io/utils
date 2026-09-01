# Validator

The validator module is the class-validator for `@zanix/utils`, built entirely
on native ECMAScript decorators (accessor decorators and `Symbol.metadata`), so
it works without `experimentalDecorators`, `reflect-metadata`, or any
TypeScript-specific decorator flag. You define a `BaseRTO` (Request Transfer
Object) subclass, decorate its accessors with validation decorators, and hand a
plain object to `classValidation` to get back a validated, transformed instance
or a structured `HttpError`.

Use it to validate and shape any request-shaped payload: HTTP bodies, route
params, query strings, message-queue payloads, or config objects. It is the most
important module of the package, and every other Zanix package that deals with
incoming data (routers, controllers, workers) builds on top of it.

## Quick example

```typescript
import {
  BaseRTO,
  classValidation,
  IsEmail,
  IsNumber,
  IsString,
  MinNumber,
} from 'jsr:@zanix/utils@[version]/validator'

class UserRTO extends BaseRTO {
  constructor(data: UserRTO) {
    super()
    this.age = Number(data.age) // fields that need a manual transform are assigned here
  }

  @IsString({ expose: true })
  accessor name!: string

  @IsEmail({ expose: true })
  accessor email!: string

  @IsNumber()
  @MinNumber(18)
  accessor age!: number

  @IsString({ optional: true, expose: true })
  accessor nickname: string | undefined
}

const user = await classValidation(UserRTO, {
  name: 'Ana',
  email: 'ana@example.com',
  age: '30',
})
// user is a UserRTO instance: { name: 'Ana', email: 'ana@example.com', age: 30, nickname: undefined }
```

Notice that `name` and `email` are populated automatically from the plain object
passed to `classValidation`, even though the constructor never assigns them —
this only happens because they pass `expose: true`; without it, a decorator like
`IsString`/`IsEmail` still validates the incoming value but the property is left
unset on the resulting instance. `age` doesn't need `expose` because it's
assigned directly in the constructor, and `IsNumber` (like `IsDate` and their
`Min*`/`Max*` counterparts) also self-exposes by default whenever it applies its
own transform — see the [Numbers](#numbers) section below. If validation fails,
`classValidation` rejects with an `HttpError('BAD_REQUEST', ...)` whose
`cause.properties` maps each invalid property to its constraints (see
[Errors](./errors.md)):

```typescript
try {
  await classValidation(UserRTO, {
    name: 'Ana',
    email: 'not-an-email',
    age: '15',
  })
} catch (err) {
  // err.cause.message === 'Request validation error'
  // err.cause.target === 'UserRTO'
  // err.cause.properties.email === [{ constraints: ["'email' must be a valid email address."], value: 'not-an-email', plainValue: 'not-an-email' }]
}
```

### `BaseRTO`

Every RTO extends the abstract `BaseRTO` class. It has no properties of its own
besides a protected `context` object, which is populated from the `ctx` option
passed to `classValidation` (or `{}` by default) and is available to
constructors, custom validation functions, and custom messages via
`this.context`. All validated properties must be declared as `accessor` fields —
plain class fields are not supported because the validation logic hooks into the
accessor's getter/setter pair. The resolved value is exposed as a normal own
property on the instance (not a getter), unless `exposeValuesAsGetter: true` is
passed to `classValidation`.

RTOs are ordinary classes, so a common way to share and compose fields across
several request shapes is to have one RTO extend another instead of repeating
the same decorated accessors:

```typescript
class PaginationRTO extends BaseRTO {
  @IsNumber()
  accessor page: number = 1

  @IsNumber()
  accessor limit: number = 10
}

// Inherits `page`/`limit`, and adds its own decorated field.
class SearchUsersRTO extends PaginationRTO {
  @IsString({ optional: true, expose: true })
  accessor query: string | undefined
}
```

### `classValidation(RTO, plainObject, options?)`

Validates `plainObject` against the given `BaseRTO` subclass and returns a
`Promise` that resolves to a validated instance of `RTO`, or rejects if there
are validation errors.

| Option                    | Type                                  | Default                                | Description                                                                                                                                                    |
| ------------------------- | ------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ctx`                     | `any`                                 | `{}`                                   | Context object injected into the instance, readable as `this.context` inside the RTO.                                                                          |
| `excludeExtraneousValues` | `boolean`                             | `true`                                 | If `false`, any property present in `plainObject` but not assigned by the RTO is copied over as-is.                                                            |
| `exposeDefaultsValues`    | `boolean`                             | `true`                                 | If `false`, accessors with `expose`/`@Expose()` do not fall back to their default value when the plain object omits the property.                              |
| `exposeValuesAsGetter`    | `boolean`                             | `false`                                | If `true`, resolved values are exposed as getters instead of plain properties. Not recommended with nested objects, since it can interfere with serialization. |
| `throwErrors`             | `(errors: ValidationError[]) => void` | throws `HttpError('BAD_REQUEST', ...)` | Custom handler invoked with the raw `ValidationError[]` instead of throwing the default `HttpError`.                                                           |

By default, when there are errors, `classValidation` throws an `HttpError` (see
[Errors](./errors.md)) whose `cause` has the shape
`{ message: 'Request validation error', target: RTO.name, properties: <formatted errors> }`.
Pass `throwErrors` if you want to handle the raw `ValidationError[]` yourself
(for example, to log them and return a custom response) instead of the default
`HttpError`.

> In practice, when using a Zanix HTTP framework such as `@zanix/server`, you
> rarely call `classValidation` yourself. Instead, you declare the RTO on the
> route/handler config (`Body`, `Params`, `Search` — see `RtoTypes` in the
> [Types reference](./types.md)) and the framework calls `classValidation`
> internally, handing you back an already-validated instance. Calling it
> directly, as shown above, is mainly for using this package's validator
> standalone (outside a Zanix framework), or for validating a payload outside
> the request/response cycle (e.g. a message-queue job or a CLI argument).

### `classMetadata(RTO)`

Returns the static field metadata for a `BaseRTO` subclass: which validation
decorator each accessor uses, with what arguments, and its
`each`/`optional`/`expose` flags — derived purely from the class definition, no
instance to construct and no plain object to validate. Where `classValidation`
runs the validation pipeline against real data, `classMetadata` introspects the
class itself, which is what a build-time consumer (an OpenAPI generator, a
form/table renderer, ...) needs.

```typescript
class UserRTO extends BaseRTO {
  @IsString({ expose: true })
  accessor name!: string

  @IsEnum(['admin', 'user'], { expose: true, optional: true })
  accessor role!: string
}

classMetadata(UserRTO)
// {
//   name: { decorator: 'IsString', args: [], each: false, optional: false, expose: true },
//   role: { decorator: 'IsEnum', args: [['admin', 'user']], each: false, optional: true, expose: true },
// }
```

Fields declared on a parent `BaseRTO` class are included for a subclass that
extends it — a field the subclass redeclares overrides the parent's entry.
`decorator` is `undefined` for a custom decorator built with `Validation()` or
a raw `defineValidationDecorator()` call, since neither registers a decorator
name; `args` holds whatever decorator-specific arguments the decorator was
called with beyond `ValidationOptions` (e.g. `IsEnum`'s allowed values), and is
empty for a decorator that takes none. See `RTOFieldMetadata` in the
[Types reference](./types.md).

A field carrying two or more stacked decorators (e.g. `@IsString() @Length({
min: 1, max: 100 })`) reports a `decorators` array alongside `decorator`/
`args` — one entry per decorator applied, in registration order:

```typescript
class ContactRTO extends BaseRTO {
  @IsString({ expose: true })
  @Length({ min: 1, max: 100 })
  accessor nickname!: string
}

classMetadata(ContactRTO)
// {
//   nickname: {
//     decorator: 'IsString',   // last-registered decorator, unchanged from a single-decorator field
//     args: [],
//     decorators: [
//       { decorator: 'Length', args: [{ min: 1, max: 100 }] },
//       { decorator: 'IsString', args: [] },
//     ],
//     each: false,
//     optional: false,
//     expose: true,
//   },
// }
```

`decorator`/`args` always mirror the last-registered decorator, exactly as
they do for a field with only one decorator — so an existing consumer reading
only those two fields keeps working unchanged. `decorators` is present only
when the field has more than one; a single-decorator field never carries it.
`each`/`optional`/`expose` are OR-merged across the stack, since that mirrors
their real runtime effect: `classValidation` treats a value as optional, or
exposes it, the moment ANY decorator in the stack says so, regardless of what
the others say.

`ValidateNested(NestedRTO)`'s entry carries `args: [NestedRTO]` — a real,
directly usable `BaseRTO` subclass constructor, not serialized data. Call
`classMetadata(NestedRTO)` on it to introspect the nested class's own fields;
resolve it yourself before passing this output through something like
`JSON.stringify` (e.g. across a subprocess boundary), since a live class
constructor doesn't survive serialization.

### `defineValidationDecorator(validation, options?, meta?)`

The primitive used internally to build every decorator in this module. It turns
a validation function into an accessor decorator, wiring the setter (runs on
every assignment, applies `transform` and calls `validation`) and the
constructor-time `init` hook (applies `expose`/`optional` semantics). Reach for
it when none of the built-in decorators fit and you want full control over
transform/expose behavior; for most custom checks, `Validation()` (below) is the
simpler option.

The optional third argument, `meta`, tags the field for `classMetadata`'s
class-level introspection — pass `{ decorator: 'MyDecoratorName' }`, plus
`args` for any decorator-specific arguments beyond `ValidationOptions` (see
`IsEnum`'s implementation for an example). It has no effect on validation
itself; omit it and the field still registers, just without a known
`decorator` name.

```typescript
const IsPositive = () =>
  defineValidationDecorator((val: number) => val > 0, {
    message: 'Must be a positive number',
  })

class OrderRTO extends BaseRTO {
  @IsPositive()
  accessor quantity!: number
}
```

## Strings

| Decorator / Function   | Signature                                                                                                     | Description                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `IsString`             | `(options?: ValidationOptions) => ValidationDecoratorDefinition`                                              | Validates that the value is a `string` (or, with `each: true`, an array of strings).                                        |
| `isString`             | `(value?: string) => boolean`                                                                                 | Raw predicate: `typeof value === 'string'`.                                                                                 |
| `isStringArray`        | `(value: string[]) => boolean`                                                                                | Raw predicate for arrays of strings.                                                                                        |
| `IsEmail`              | `(options?: ValidationOptions) => ValidationDecoratorDefinition`                                              | Validates an email address against `EMAIL_REGEX`.                                                                           |
| `isEmail`              | `(value?: string) => boolean`                                                                                 | Raw email predicate.                                                                                                        |
| `isEmailArray`         | `(value: string[]) => boolean`                                                                                | Raw predicate for arrays of emails.                                                                                         |
| `IsUrl`                | `(options?: ValidationOptions) => ValidationDecoratorDefinition`                                              | Validates a URL against `URL_REGEX` (scheme and `www.` are optional).                                                       |
| `isUrl`                | `(value?: string) => boolean`                                                                                 | Raw URL predicate.                                                                                                          |
| `isUrlArray`           | `(value: string[]) => boolean`                                                                                | Raw predicate for arrays of URLs.                                                                                           |
| `IsUUID`               | `(options?: ValidationOptions) => ValidationDecoratorDefinition`                                              | Validates a UUID against `UUID_REGEX`.                                                                                      |
| `isUUID`               | `(value?: string) => boolean`                                                                                 | Raw UUID predicate.                                                                                                         |
| `isUUIDArray`          | `(value: string[]) => boolean`                                                                                | Raw predicate for arrays of UUIDs.                                                                                          |
| `IsObjectID`           | `(options?: ValidationOptions) => ValidationDecoratorDefinition`                                              | Validates a MongoDB `ObjectId` (24-character hex string) against `OBJECT_ID_REGEX`.                                         |
| `isObjectId`           | `(value?: string) => boolean`                                                                                 | Raw ObjectId predicate.                                                                                                     |
| `isObjectIdArray`      | `(value: string[]) => boolean`                                                                                | Raw predicate for arrays of ObjectIds.                                                                                      |
| `IsPhone`              | `(options?: ValidationOptions) => ValidationDecoratorDefinition`                                              | Validates an E.164-like phone number against `PHONE_REGEX` (optional leading `+`, 2-15 digits).                             |
| `isPhone`              | `(value?: string) => boolean`                                                                                 | Raw phone predicate.                                                                                                        |
| `isPhoneArray`         | `(value: string[]) => boolean`                                                                                | Raw predicate for arrays of phone numbers.                                                                                  |
| `IsNumberString`       | `(options?: ValidationOptions) => ValidationDecoratorDefinition`                                              | Validates that the value is a numeric string (`^\d+(\.\d+)?$`), e.g. `"12"` or `"12.5"`. Does not convert it to a `number`. |
| `isNumberString`       | `(value?: string) => boolean`                                                                                 | Raw numeric-string predicate.                                                                                               |
| `isNumberStringArray`  | `(value: string[]) => boolean`                                                                                | Raw predicate for arrays of numeric strings.                                                                                |
| `IsBooleanString`      | `(options?: ValidationOptions) => ValidationDecoratorDefinition`                                              | Validates that the value is `"true"` or `"false"` (case-insensitive), as a string.                                          |
| `isBooleanString`      | `(value?: string) => boolean`                                                                                 | Raw boolean-string predicate.                                                                                               |
| `isBooleanStringArray` | `(value: string[]) => boolean`                                                                                | Raw predicate for arrays of boolean strings.                                                                                |
| `Length`               | `(constraints: { min?: number; max?: number }, options?: ValidationOptions) => ValidationDecoratorDefinition` | Validates that a string's length is within `[min, max]`. `min` defaults to `0`, `max` defaults to `Infinity`.               |
| `stringLength`         | `(value: string, min: number, max: number) => boolean`                                                        | Raw length predicate for a single string.                                                                                   |
| `stringLengthArray`    | `(values: string[], min: number, max: number) => boolean`                                                     | Raw length predicate for arrays of strings.                                                                                 |
| `Match`                | `(pattern: RegExp, options?: ValidationOptions) => ValidationDecoratorDefinition`                             | Validates that a string matches an arbitrary `RegExp`.                                                                      |
| `match`                | `(regex: RegExp, value?: string) => boolean`                                                                  | Raw regex-match predicate.                                                                                                  |
| `matchArray`           | `(regex: RegExp, values: string[]) => boolean`                                                                | Raw regex-match predicate for arrays of strings.                                                                            |

### Examples

```typescript
class ContactRTO extends BaseRTO {
  @IsString()
  accessor name!: string

  @IsEmail()
  accessor email!: string

  @IsPhone({ optional: true })
  accessor phone: string | undefined

  @IsUrl({ each: true, optional: true })
  accessor links: string[] | undefined

  @IsUUID()
  accessor externalId!: string

  @Length({ min: 8, max: 64 })
  accessor password!: string

  @Match(/^[A-Z]{2}\d{4}$/, {
    message: (property) => `'${property}' must look like AB1234`,
  })
  accessor code!: string
}
```

`IsNumberString` and `IsBooleanString` validate that a string _looks like_ a
number or a boolean, without converting it — the value stays a `string`. Reach
for `IsNumber`/`IsBoolean` instead when you also want the value converted to its
native type:

```typescript
class FeatureFlagRTO extends BaseRTO {
  @IsNumberString({ expose: true }) // stays "42", not 42
  accessor rawScore: string = '0'

  @IsBooleanString({ each: true })
  accessor flags!: string[] // e.g. ['true', 'false']
}
```

## Numbers

| Decorator / Function | Signature                                                                                  | Description                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `IsNumber`           | `(options?: DefaultTransformValidationOpts) => ValidationDecoratorDefinition`              | Validates that the value is a `number`. By default (`transform: true`) it converts the incoming value with `Number(...)`, so it also self-exposes the property — you don't need `expose` or `@Expose()`. Pass `{ transform: false }` to disable this conversion. |
| `isNumber`           | `(value?: number) => boolean`                                                              | Raw predicate: `typeof value === 'number'`.                                                                                                                                                                                                                      |
| `isNumberArray`      | `(values: number[]) => boolean`                                                            | Raw predicate for arrays of numbers.                                                                                                                                                                                                                             |
| `MinNumber`          | `(num: number, options?: DefaultTransformValidationOpts) => ValidationDecoratorDefinition` | Validates that the value is a number `>= num`. Same auto-transform/auto-expose behavior as `IsNumber`.                                                                                                                                                           |
| `minNumber`          | `(num: number, value?: number) => boolean`                                                 | Raw predicate.                                                                                                                                                                                                                                                   |
| `minNumberArray`     | `(num: number, values: number[]) => boolean`                                               | Raw predicate for arrays.                                                                                                                                                                                                                                        |
| `MaxNumber`          | `(num: number, options?: DefaultTransformValidationOpts) => ValidationDecoratorDefinition` | Validates that the value is a number `<= num`. Same auto-transform/auto-expose behavior as `IsNumber`.                                                                                                                                                           |
| `maxNumber`          | `(num: number, value?: number) => boolean`                                                 | Raw predicate.                                                                                                                                                                                                                                                   |
| `maxNumberArray`     | `(num: number, values: number[]) => boolean`                                               | Raw predicate for arrays.                                                                                                                                                                                                                                        |

### Examples

```typescript
class OrderRTO extends BaseRTO {
  @IsNumber() // transforms "30" -> 30 and exposes it automatically
  accessor quantity!: number

  @MinNumber(0)
  @MaxNumber(100)
  accessor discountPercent!: number

  @MinNumber(1, { each: true, optional: true })
  accessor itemIds: number[] | undefined

  @IsNumber({ transform: false }) // keep the raw type, only validate
  accessor rawScore!: number
}
```

## Dates

| Decorator / Function | Signature                                                                                 | Description                                                                                                                                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `IsDate`             | `(options?: DefaultTransformValidationOpts) => ValidationDecoratorDefinition`             | Validates that the value is a valid `Date` instance (not `Invalid Date`). By default (`transform: true`) it converts the incoming value with `new Date(...)`, so it self-exposes the property. Pass `{ transform: false }` to disable this conversion. |
| `isDate`             | `(value?: Date) => boolean`                                                               | Raw predicate.                                                                                                                                                                                                                                         |
| `isDateArray`        | `(values: Date[]) => boolean`                                                             | Raw predicate for arrays of dates.                                                                                                                                                                                                                     |
| `MinDate`            | `(date: Date, options?: DefaultTransformValidationOpts) => ValidationDecoratorDefinition` | Validates that the value is a `Date` `>= date`. Same auto-transform/auto-expose behavior as `IsDate`.                                                                                                                                                  |
| `minDate`            | `(date: Date, value?: Date) => boolean`                                                   | Raw predicate.                                                                                                                                                                                                                                         |
| `minDateArray`       | `(date: Date, values: Date[]) => boolean`                                                 | Raw predicate for arrays.                                                                                                                                                                                                                              |
| `MaxDate`            | `(date: Date, options?: DefaultTransformValidationOpts) => ValidationDecoratorDefinition` | Validates that the value is a `Date` `<= date`. Same auto-transform/auto-expose behavior as `IsDate`.                                                                                                                                                  |
| `maxDate`            | `(date: Date, value?: Date) => boolean`                                                   | Raw predicate.                                                                                                                                                                                                                                         |
| `maxDateArray`       | `(date: Date, values: Date[]) => boolean`                                                 | Raw predicate for arrays.                                                                                                                                                                                                                              |

### Examples

```typescript
class BookingRTO extends BaseRTO {
  @IsDate()
  accessor checkIn!: Date

  @MinDate(new Date('2020-01-01'), { optional: true })
  accessor validSince: Date | undefined

  @MaxDate(new Date(), { each: true, optional: true })
  accessor pastEvents: Date[] | undefined

  @IsDate({ transform: false })
  accessor rawDate!: Date // must already be a Date instance, no string coercion
}
```

## Arrays

| Decorator / Function | Signature                                                                                                                   | Description                                                                                                                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `IsArray`            | `(options?: ValidationOptions) => ValidationDecoratorDefinition`                                                            | Validates that the value is an array (with `each: true`, that it is an array of arrays).                                                                                                                                                                  |
| `isArray`            | `(value?: unknown[]) => boolean`                                                                                            | Raw predicate: `Array.isArray(value)`.                                                                                                                                                                                                                    |
| `isArrayOfArray`     | `(value: unknown[][]) => boolean`                                                                                           | Raw predicate that every top-level item is itself an array. If the top-level value is not an array, it is wrapped in one (`[value]`) before checking, so a single non-array value simply fails as `false`.                                                |
| `ArrayLength`        | `(constraints: { min?: number; max?: number }, options?: Omit<ValidationOptions, 'each'>) => ValidationDecoratorDefinition` | Validates that an array's length is within `[min, max]`. `min` defaults to `2`, `max` defaults to `Infinity`. Does not support `each` (it already targets the whole array).                                                                               |
| `arrayLength`        | `(value: unknown[], min: number, max: number) => boolean`                                                                   | Raw predicate. **Important:** it internally requires `min >= 1` (`Array.isArray(value) && min >= 1 && ...`); passing `min: 0` makes the validation always return `false`, even for non-empty arrays, since arrays are expected to be non-empty by design. |

### Examples

```typescript
class TagsRTO extends BaseRTO {
  @IsArray()
  accessor rawList!: unknown[]

  @ArrayLength({ min: 1, max: 5 })
  @IsString({ each: true })
  accessor tags!: string[]
}
```

Because `min` defaults to `2` and the underlying check rejects any `min < 1`,
always pass an explicit `min: 1` (or higher) to `ArrayLength` when you want to
allow single-element arrays — `{ min: 0 }` is not a valid way to express "any
length, including empty," it will simply reject every array.

## Generic / Enum / Boolean

| Decorator / Function | Signature                                                                                                      | Description                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `IsBoolean`          | `(options?: ValidationOptions) => ValidationDecoratorDefinition`                                               | Validates that the value is strictly `true` or `false`.                                                                            |
| `isBoolean`          | `(value?: boolean) => boolean`                                                                                 | Raw predicate.                                                                                                                     |
| `isBooleanArray`     | `(value: boolean[]) => boolean`                                                                                | Raw predicate for arrays of booleans.                                                                                              |
| `IsEnum`             | `(validations: EnumType, options?: ValidationOptions) => ValidationDecoratorDefinition`                        | Validates that the value is a member of the given enum-like object or array of literals.                                           |
| `isEnum`             | `(value: unknown, enumObj: EnumType) => boolean`                                                               | Raw predicate. Accepts a TypeScript `enum` object or a plain array of allowed literal values.                                      |
| `isEnumArray`        | `(value: unknown[], enumObj: EnumType) => boolean`                                                             | Raw predicate for arrays; returns `false` (instead of throwing) if `value` is not an array.                                        |
| `EnumType`           | `type EnumType = Record<string, unknown> \| unknown[]`                                                         | The type accepted by `IsEnum`/`isEnum`/`isEnumArray`: either an enum-like object or an array of literal values treated as an enum. |
| `Expose`             | `(options?: Pick<ValidationOptions, 'message' \| 'optional' \| 'transform'>) => ValidationDecoratorDefinition` | Exposes an accessor's value from the plain payload without adding any validation logic. See below for when it's needed.            |

### Examples

```typescript
enum Role {
  Admin = 'admin',
  User = 'user',
}

class AccountRTO extends BaseRTO {
  @IsBoolean()
  accessor isActive!: boolean

  @IsEnum(Role)
  accessor role!: Role

  @IsEnum(['light', 'dark'], { optional: true })
  accessor theme: string | undefined
}
```

`EnumType` is typed as a mutable `unknown[]`, so passing a `readonly` array
(e.g. a `const` array of allowed literal values, `each: true` array validation
against such a list, etc.) doesn't satisfy it directly — cast it, typically as
`MY_CONST_ARRAY as unknown as string[]`:

```typescript
const ROLES = ['admin', 'user'] as const

class AccountRTO extends BaseRTO {
  @IsEnum(ROLES as unknown as string[])
  accessor role!: typeof ROLES[number]
}
```

`@Expose()` (or the equivalent `expose: true` option available on every other
decorator) is what makes a property auto-populate from the plain object passed
to `classValidation`. Reach for the bare `@Expose()` decorator only when a
property needs no validation and no transformation logic of its own — for
example, a required field with no format constraints, or a defaulted field that
should still accept an override from the payload:

```typescript
class ProfileRTO extends BaseRTO {
  constructor(data: ProfileRTO) {
    super()
    this.age = data.age
  }

  @Expose() // required, no validation, no transform
  accessor displayName!: string

  @Expose() // defaulted, but still overridable from the plain payload
  accessor age: number = 3

  @Expose({ optional: true })
  accessor referredBy: string | undefined
}
```

Every other decorator that performs actual validation (`IsString`, `IsEmail`,
`IsEnum`, etc.) already exposes the property when you pass `expose: true` in its
options — you don't need to stack `@Expose()` on top of them. `IsNumber`,
`MinNumber`, `MaxNumber`, `IsDate`, `MinDate`, `MaxDate`, and `ValidateNested`
go a step further and expose automatically (with transformation), so `expose` is
redundant on those too.

## Nested / Custom validation

| Decorator                   | Signature                                                                                                                          | Description                                                                                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ValidateNested`            | `(RTO: new (data: never) => BaseRTO, options?: Omit<ValidationOptions, 'transform' \| 'expose'>) => ValidationDecoratorDefinition` | Validates a nested `BaseRTO` object (or, with `each: true`, an array of them) by recursively running `classValidation`'s internal logic against `RTO`. Always exposes the property.                 |
| `Validation`                | `(validation: ValidationFunction, options?: ValidationOptions) => ValidationDecoratorDefinition`                                   | Generic decorator for custom validation logic: `validation` receives `(value, property)`, is called with `this` bound to the exposed instance data, and can return `boolean` or `Promise<boolean>`. |
| `classValidation`           | see [Quick example](#quick-example)                                                                                                | Runs the whole validation pipeline for a `BaseRTO` class against a plain object.                                                                                                                    |
| `BaseRTO`                   | see [`BaseRTO`](#baserto)                                                                                                          | The abstract base class every RTO extends.                                                                                                                                                          |
| `defineValidationDecorator` | see [`defineValidationDecorator`](#definevalidationdecoratorvalidation-options-meta)                                               | The low-level primitive used to build all decorators above.                                                                                                                                         |

### Examples

`ValidateNested` composes RTOs. Internally, nested errors are attached as
`children` on the parent's raw `ValidationError`; once `classValidation`'s
default error formatting runs, they surface as a `{ message, properties }`
object under the parent property (see [Errors](./errors.md) for the exact
shape). A nested value that is entirely missing produces a
`The '<property>' property must be defined.` error unless `optional: true` is
set:

```typescript
class AddressRTO extends BaseRTO {
  @IsString()
  accessor city!: string

  @IsString()
  accessor country!: string
}

class CustomerRTO extends BaseRTO {
  @ValidateNested(AddressRTO)
  accessor address!: AddressRTO

  @ValidateNested(AddressRTO, { each: true, optional: true })
  accessor previousAddresses: AddressRTO[] | undefined
}

const customer = await classValidation(CustomerRTO, {
  address: { city: 'Bogotá', country: 'CO' },
})
```

Note that default values on nested accessors are not re-validated, since they
were already constructed by code:

```typescript
class OrderRTO extends BaseRTO {
  @ValidateNested(AddressRTO)
  accessor shipping: AddressRTO = new AddressRTO({
    city: 'Bogotá',
    country: 'CO',
  }) // not validated against decorators
}
```

`Validation` lets you express cross-field or arbitrary rules. The validation
function is called with `this` bound to an object that merges the exposed
properties with the current instance, so you can compare it against other
fields, and `target` inside the custom message gives you the same merged view:

```typescript
class RangeRTO extends BaseRTO {
  @IsNumber({ expose: true })
  accessor min!: number

  @Validation<RangeRTO>(function (value) {
    return typeof value === 'number' && value >= this.min
  }, {
    message: (property, value, target) => `'${property}' (${value}) must be >= min (${target.min})`,
  })
  accessor max!: number
}
```

A common pattern is to wrap `Validation` in your own reusable decorator, the
same way `IsPositive` wraps `defineValidationDecorator` above — this is the
idiomatic way to build an app-specific decorator (e.g. `IsObjectID` for a
database ID format) without touching this package's internals:

```typescript
import type { ValidationOptions } from 'jsr:@zanix/utils@[version]/types'

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i

const IsObjectID = (options?: ValidationOptions) =>
  Validation(
    (value) => typeof value === 'string' && OBJECT_ID_REGEX.test(value),
    {
      message: (property) => `'${property}' must be a valid ID`,
      ...options,
    },
  )

class GetUserRTO extends BaseRTO {
  @IsObjectID({ expose: true })
  accessor userId!: string
}
```

`this.context`, populated via the `ctx` option of `classValidation`, is also
reachable from a `Validation` function or a custom `message` callback through
the `target` argument (`target.context`), which is useful for injecting
request-scoped data (a logger, a tenant id, etc.) without polluting the payload
being validated.

## See also

- [Types reference](./types.md) — full definitions for `ValidationOptions`,
  `ValidationDecorator`, `ValidationDecoratorDefinition`, `ValidationFunction`,
  `ValidationError`, and related types.
- [Errors](./errors.md) — `HttpError`, the exact shape `classValidation` throws
  on `BAD_REQUEST`, and how to customize error handling with `throwErrors`.
