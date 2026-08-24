import {
  BaseRTO,
  classMetadata,
  classValidation,
  defineValidationDecorator,
} from 'modules/validations/mod.ts'
import { defineCatalogValidationDecorator } from 'modules/validations/base/definitions/decorators.ts'
import { IsArray } from 'modules/validations/decorators/arrays/is-array.ts'
import { IsBoolean } from 'modules/validations/decorators/generic/is-boolean.ts'
import { IsEnum } from 'modules/validations/decorators/generic/is-enum.ts'
import { IsNumber } from 'modules/validations/decorators/numbers/is-number.ts'
import { IsEmail } from 'modules/validations/decorators/strings/is-email.ts'
import { IsString } from 'modules/validations/decorators/strings/is-string.ts'
import { Length } from 'modules/validations/decorators/strings/length.ts'
import { Expose } from 'modules/validations/decorators/generic/utils.ts'
import { assertEquals } from '@std/assert'

class ProfileRTO extends BaseRTO {
  @IsString({ expose: true })
  accessor name!: string

  @IsNumber({ optional: true })
  accessor age!: number

  @IsEnum(['admin', 'user'], { expose: true, optional: true })
  accessor role!: string

  @IsArray({ each: true, optional: true })
  accessor tags!: string[]

  @IsBoolean({ optional: true })
  accessor active!: boolean

  @Expose()
  accessor untouched!: string
}

Deno.test('classMetadata - registers each of the 6 targeted decorators with their own kind', () => {
  const meta = classMetadata(ProfileRTO)

  assertEquals(meta.name, {
    decorator: 'IsString',
    args: [],
    each: false,
    optional: false,
    expose: true,
  })
  // `IsNumber` defaults `transform: true`, which forces `expose: true` (see `defineValidationDecorator`).
  assertEquals(meta.age, {
    decorator: 'IsNumber',
    args: [],
    each: false,
    optional: true,
    expose: true,
  })
  assertEquals(meta.role, {
    decorator: 'IsEnum',
    args: [['admin', 'user']],
    each: false,
    optional: true,
    expose: true,
  })
  assertEquals(meta.tags, {
    decorator: 'IsArray',
    args: [],
    each: true,
    optional: true,
    expose: false,
  })
  assertEquals(meta.active, {
    decorator: 'IsBoolean',
    args: [],
    each: false,
    optional: true,
    expose: false,
  })
  assertEquals(meta.untouched, {
    decorator: 'Expose',
    args: [],
    each: false,
    optional: false,
    expose: true,
  })
})

Deno.test('classMetadata - returns a class-level result, no instance required', () => {
  // No `new ProfileRTO()` anywhere in this file — introspection works purely off the class.
  assertEquals(Object.keys(classMetadata(ProfileRTO)).length, 6)
})

class BaseWithFields extends BaseRTO {
  @IsString({ expose: true })
  accessor id!: string

  @IsNumber({ optional: true })
  accessor version: number = 1
}

class ChildRTO extends BaseWithFields {
  @IsBoolean({ optional: true })
  accessor enabled!: boolean
}

class OverridingChildRTO extends BaseWithFields {
  @IsNumber({ optional: true, transform: false })
  override accessor version: number = 1
}

Deno.test('classMetadata - includes fields declared on a parent BaseRTO class', () => {
  const meta = classMetadata(ChildRTO)

  assertEquals(Object.keys(meta).sort(), ['enabled', 'id', 'version'])
  assertEquals(meta.id.decorator, 'IsString')
  assertEquals(meta.version.decorator, 'IsNumber')
  assertEquals(meta.enabled.decorator, 'IsBoolean')
})

Deno.test('classMetadata - a redeclared field on a subclass overrides the parent entry', () => {
  const parentMeta = classMetadata(BaseWithFields)
  const overriddenMeta = classMetadata(OverridingChildRTO)

  assertEquals(parentMeta.version.expose, true) // no explicit `transform`, defaults apply
  assertEquals(overriddenMeta.version.expose, false) // `transform: false` on the override
  assertEquals(Object.keys(overriddenMeta).sort(), ['id', 'version'])
})

Deno.test('classMetadata - a class with no decorated accessors returns an empty registry', () => {
  class PlainRTO extends BaseRTO {}

  assertEquals(classMetadata(PlainRTO), {})
})

Deno.test('classMetadata - a custom decorator with no meta tag has no known decorator kind', () => {
  const IsPositive = () =>
    defineValidationDecorator((val: number) => val > 0, { message: 'Must be positive' })

  class OrderRTO extends BaseRTO {
    @IsPositive()
    accessor quantity!: number
  }

  const meta = classMetadata(OrderRTO)

  assertEquals(meta.quantity.decorator, undefined)
  assertEquals(meta.quantity.args, [])
})

// The counterpart to the case above: `defineValidationDecorator`'s third `meta` argument is
// optional (so a fully custom, consumer-authored decorator can omit it, as proven above), but a
// caller that DOES pass it — even without going through the internal, meta-required
// `defineCatalogValidationDecorator` every catalog `IsX` decorator uses (see
// `base/definitions/decorators.ts`) — must still have it threaded through to `classMetadata`
// exactly like a real catalog decorator would. Confirms the public function's optional `meta`
// isn't optional-and-silently-dropped-when-present, just optional-to-omit.
Deno.test({
  name:
    'classMetadata - a custom decorator WITH an explicit meta tag reports it like a catalog decorator',
  fn: () => {
    const IsPositive = () =>
      defineValidationDecorator((val: number) => val > 0, { message: 'Must be positive' }, {
        decorator: 'IsPositive',
        args: ['custom-arg'],
      })

    class OrderRTO extends BaseRTO {
      @IsPositive()
      accessor quantity!: number
    }

    const meta = classMetadata(OrderRTO)

    assertEquals(meta.quantity.decorator, 'IsPositive')
    assertEquals(meta.quantity.args, ['custom-arg'])
  },
})

// `defineValidationDecorator`'s `message` option accepts a plain string OR a
// `(property, value, target) => string` function — internally normalized via
// `const messageResult = typeof message === 'string' ? () => message : message`. Every other
// test in this file that passes a string `message` (like the "no meta tag" case above) only
// calls `classMetadata`, which never runs the setter path that actually invokes `messageResult`
// — this is the only test that drives a real validation failure through `classValidation`,
// exercising the plain-string branch instead of just the function branch.
Deno.test({
  name: 'a decorator with a plain string message threads it through a real validation failure',
  fn: async () => {
    const IsPositive = () =>
      defineValidationDecorator((val: number) => val > 0, { message: 'Must be positive' })

    class OrderRTO extends BaseRTO {
      // An explicit assignment (as `BaseRTO`'s own doc example does) is required here: `expose`
      // defaults to `false` for a bare `defineValidationDecorator` call with no `transform`/
      // `expose` option, so nothing would otherwise copy `quantity` from the plain payload onto
      // the accessor — and the setter (the only thing that calls `messageResult`) never fires
      // for a value that's never assigned.
      constructor(data: { quantity: number }) {
        super()
        this.quantity = data.quantity
      }

      @IsPositive()
      accessor quantity!: number
    }

    let ran = false
    await classValidation(OrderRTO, { quantity: -1 }, {
      throwErrors: (errors) => {
        ran = true
        assertEquals(errors[0].constraints, ['Must be positive'])
      },
    })
    assertEquals(ran, true)
  },
})

// Direct coverage of `defineCatalogValidationDecorator` itself (see `base/definitions/
// decorators.ts`) rather than only exercising it indirectly through a real `IsX` file — every
// catalog decorator (`decorator-catalog-metadata.test.ts`) already proves it threads `meta`
// through correctly in practice; this isolates that it's a genuine passthrough to
// `defineValidationDecorator`, not a diverging implementation.
Deno.test({
  name:
    'classMetadata - defineCatalogValidationDecorator threads its required meta through exactly like the public function',
  fn: () => {
    const IsEven = () =>
      defineCatalogValidationDecorator((val: number) => val % 2 === 0, {
        message: 'Must be even',
      }, { decorator: 'IsEven', args: [] })

    class OrderRTO extends BaseRTO {
      @IsEven()
      accessor count!: number
    }

    const meta = classMetadata(OrderRTO)

    assertEquals(meta.count.decorator, 'IsEven')
    assertEquals(meta.count.args, [])
  },
})

Deno.test('classMetadata - coexists with classValidation without interfering', async () => {
  // classMetadata is purely additive: registering into `context.metadata` at decoration time
  // must not change what classValidation actually validates against real data.
  const valid = await classValidation(ProfileRTO, {
    name: 'Jane',
    role: 'admin',
    tags: ['a', 'b'],
    active: true,
    untouched: 'x',
  })
  assertEquals(valid.name, 'Jane')
  assertEquals(valid.role, 'admin')

  await classValidation(ProfileRTO, { role: 'not-a-role' }, {
    throwErrors: (errors) => {
      assertEquals(errors.some((error) => error.property === 'role'), true)
    },
  })

  // Metadata introspection still reflects the class definition after real validation ran.
  const meta = classMetadata(ProfileRTO)
  assertEquals(meta.role.decorator, 'IsEnum')
  assertEquals(meta.role.args, [['admin', 'user']])
})

Deno.test('classMetadata - two unrelated classes never leak fields into each other', () => {
  class FirstRTO extends BaseRTO {
    @IsString({ expose: true })
    accessor value!: string
  }

  class SecondRTO extends BaseRTO {
    @IsNumber({ optional: true })
    accessor value!: number
  }

  assertEquals(classMetadata(FirstRTO).value.decorator, 'IsString')
  assertEquals(classMetadata(SecondRTO).value.decorator, 'IsNumber')
})

// Regression coverage for the real gap this stacking support fixes: `registerClassField` used to
// plain-overwrite a field's entry on every decorator registration, so a field carrying two or
// more stacked decorators (a common, realistic shape — e.g. `@IsString() @Length(...)`) only ever
// reported the LAST one applied, silently losing every earlier decorator from `classMetadata`.
Deno.test('classMetadata - stacked decorators accumulate; `decorator`/`args` stay as-is', () => {
  class ContactRTO extends BaseRTO {
    // Decorators apply bottom-up: `Length` (closest to the accessor) registers first, `IsString`
    // (topmost) registers last — so `decorator`/`args` below reflect `IsString`, unchanged from
    // this function's original single-decorator behavior.
    @IsString({ expose: true })
    @Length({ min: 1, max: 100 }, { optional: true })
    accessor nickname!: string
  }

  const meta = classMetadata(ContactRTO)

  // Unchanged (last-registered-wins) singular fields — a consumer reading only these two keeps
  // working exactly as before.
  assertEquals(meta.nickname.decorator, 'IsString')
  assertEquals(meta.nickname.args, [])

  // New: the full stack, in registration order, with nothing lost.
  assertEquals(meta.nickname.decorators, [
    { decorator: 'Length', args: [{ min: 1, max: 100 }] },
    { decorator: 'IsString', args: [] },
  ])

  // `expose`/`optional` are field-wide runtime state, not one decorator's identity: `IsString`
  // set `expose: true` and `Length` set `optional: true` — since either stacked decorator's own
  // options actually flip that shared runtime behavior on for the whole property (see
  // `class-fields.ts`), both must be reported `true` here too, not overwritten by whichever
  // decorator happened to register last.
  assertEquals(meta.nickname.expose, true)
  assertEquals(meta.nickname.optional, true)
  assertEquals(meta.nickname.each, false)
})

Deno.test('classMetadata - a single-decorator field never gets a `decorators` entry', () => {
  const meta = classMetadata(ProfileRTO)

  assertEquals('decorators' in meta.name, false)
})

Deno.test('classMetadata - a realistic email + length stack reports every decorator', () => {
  class SignupRTO extends BaseRTO {
    @IsEmail({ expose: true })
    @Length({ max: 255 })
    accessor email!: string
  }

  const meta = classMetadata(SignupRTO)

  assertEquals(meta.email.decorator, 'IsEmail')
  assertEquals(meta.email.decorators, [
    { decorator: 'Length', args: [{ min: 0, max: 255 }] },
    { decorator: 'IsEmail', args: [] },
  ])
})
