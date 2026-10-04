import { assertEquals, assertRejects } from '@std/assert'
import { type BaseRTO, classMetadata, classValidation } from 'modules/validations/mod.ts'
import { HttpError } from 'modules/errors/main.ts'
import {
  DefaultsAsyncRTO,
  EachTransformRTO,
  ExposedTriggerRTO,
  IntentFirstRTO,
  IntentLastRTO,
  TypedTriggerRTO,
  UnexposedTriggerRTO,
} from './rtos/required-when.ts'

type Refusals = Record<string, string[]> | undefined

/** Runs `classValidation` and returns each refused field with its constraints (or `undefined`). */
async function refusals<T extends BaseRTO>(
  // deno-lint-ignore no-explicit-any
  RTO: new (data: any) => T,
  body: Record<string, unknown>,
): Promise<Refusals> {
  try {
    await classValidation(RTO, body)
    return undefined
  } catch (error) {
    const { properties } = (error as HttpError).cause as {
      properties: Record<string, { constraints: string[] }[]>
    }
    return Object.fromEntries(
      Object.entries(properties).map(([field, [first]]) => [field, first.constraints]),
    )
  }
}

const RTOS = [['trigger first', IntentFirstRTO], ['trigger last', IntentLastRTO]] as const

for (const [order, RTO] of RTOS) {
  Deno.test(`RequiredWhen (${order}): condition met × field present, absent, empty, blank, wrong type`, async () => {
    const full = { intent: 'create', line1: 'a', city: 'b', phone: 'c', note: 'd' }
    assertEquals(await refusals(RTO, full), undefined)

    // absent
    assertEquals(await refusals(RTO, { ...full, line1: undefined }), { line1: ['line1-required'] })
    const { line1: _line1, ...withoutLine1 } = full
    assertEquals(await refusals(RTO, withoutLine1), { line1: ['line1-required'] })
    // empty and blank
    assertEquals(await refusals(RTO, { ...full, line1: '' }), { line1: ['line1-required'] })
    assertEquals(await refusals(RTO, { ...full, line1: '   \t ' }), { line1: ['line1-required'] })
    // wrong type: the type message, not the required one
    assertEquals(await refusals(RTO, { ...full, city: 5 }), {
      city: ["'city' must be a valid string."],
    })
    assertEquals(await refusals(RTO, { ...full, city: { a: 1 } }), {
      city: ["'city' must be a valid string."],
    })
  })

  Deno.test(`RequiredWhen (${order}): condition not met accepts absent, empty, blank and any string`, async () => {
    const values = [undefined, '', '   ', 'text']
    const results = await Promise.all(
      values.map((value) =>
        refusals(RTO, { intent: 'delete', id: 'x', line1: value, city: value })
      ),
    )
    assertEquals(results, values.map(() => undefined))
    // phone is required for `create` and `update` only
    assertEquals(await refusals(RTO, { intent: 'delete', phone: '' }), undefined)
    // a wrong type is still refused when the condition is not met (a custom message replaces both)
    assertEquals(await refusals(RTO, { intent: 'delete', line1: 5 }), {
      line1: ['line1-required'],
    })
    assertEquals(await refusals(RTO, { intent: 'delete', city: 5 }), {
      city: ["'city' must be a valid string."],
    })
  })

  Deno.test(`RequiredWhen (${order}): every required field is reported at once`, async () => {
    assertEquals(await refusals(RTO, { intent: 'create' }), {
      line1: ['line1-required'],
      city: ["'city' is required."],
      phone: ['phone-required'],
      note: ["'note' is required."],
    })
    assertEquals(await refusals(RTO, { intent: 'create', line1: ' ', city: '', phone: 'ok' }), {
      line1: ['line1-required'],
      city: ["'city' is required."],
      note: ["'note' is required."],
    })
  })

  Deno.test(`RequiredWhen (${order}): list and predicate conditions`, async () => {
    // list: create and update require phone
    assertEquals(await refusals(RTO, { intent: 'update', note: 'n' }), {
      phone: ['phone-required'],
    })
    assertEquals(await refusals(RTO, { intent: 'update', phone: 'p', note: 'n' }), undefined)
    // predicate: every intent but delete requires note
    assertEquals(await refusals(RTO, { intent: 'delete' }), undefined)
    assertEquals(await refusals(RTO, { intent: 'update', phone: 'p' }), {
      note: ["'note' is required."],
    })
  })

  Deno.test(`RequiredWhen (${order}): a missing or invalid intent reports only the intent`, async () => {
    const bodies = [{}, { intent: 'bogus' }, { intent: '' }, { intent: 5 }, { intent: null }]
    const results = await Promise.all(bodies.map((body) => refusals(RTO, body)))
    for (const result of results) {
      // `note` is excluded: its predicate (`intent !== 'delete'`) holds for any non-delete value
      assertEquals(Object.keys(result ?? {}).includes('intent'), true)
      assertEquals(Object.keys(result ?? {}).includes('line1'), false)
      assertEquals(Object.keys(result ?? {}).includes('city'), false)
      assertEquals(Object.keys(result ?? {}).includes('phone'), false)
    }
  })

  Deno.test(`RequiredWhen (${order}): the validated instance keeps the submitted values`, async () => {
    const rto = await classValidation(RTO, {
      intent: 'create',
      line1: ' street ',
      city: 'c',
      phone: 'p',
      note: 'n',
      extra: 'dropped',
    })
    assertEquals({ ...rto }, {
      intent: 'create',
      line1: ' street ',
      city: 'c',
      phone: 'p',
      note: 'n',
      id: undefined,
    })
    const deleted = await classValidation(RTO, { intent: 'delete', id: '7', line1: '' })
    assertEquals(deleted.line1, '')
    assertEquals(deleted.city, undefined)
    assertEquals(deleted.id, '7')
  })
}

Deno.test('RequiredWhen: the result does not depend on the order of the keys of the body', async () => {
  const keys = ['intent', 'line1', 'phone'] as const
  const body: Record<string, unknown> = { intent: 'create', line1: 'a', phone: ' ' }
  const permutations = [keys, [...keys].reverse(), ['phone', 'line1', 'intent']]
  const expected = {
    phone: ['phone-required'],
    city: ["'city' is required."],
    note: ["'note' is required."],
  }
  const runs = RTOS.flatMap(([, RTO]) =>
    permutations.map((order) => {
      const ordered: Record<string, unknown> = {}
      for (const key of order) if (key in body) ordered[key] = body[key]
      return refusals(RTO, ordered)
    })
  )
  for (const result of await Promise.all(runs)) assertEquals(result, expected)
})

Deno.test('RequiredWhen: a trigger declared with `@Expose()` works whatever the decorator order', async () => {
  assertEquals(await refusals(ExposedTriggerRTO, { mode: 'strict' }), {
    name: ['name-required'],
  })
  assertEquals(await refusals(ExposedTriggerRTO, { mode: 'strict', name: ' ' }), {
    name: ['name-required'],
  })
  assertEquals(await refusals(ExposedTriggerRTO, { mode: 'strict', name: 'n' }), undefined)
  assertEquals(await refusals(ExposedTriggerRTO, { mode: 'lax' }), undefined)
  assertEquals(await refusals(ExposedTriggerRTO, {}), undefined)
})

Deno.test('RequiredWhen: a trigger that is not exposed is read from the submitted payload', async () => {
  assertEquals(await refusals(UnexposedTriggerRTO, { mode: 'strict' }), {
    name: ['name-required'],
  })
  assertEquals(await refusals(UnexposedTriggerRTO, { mode: 'strict', name: 'n' }), undefined)
  assertEquals(await refusals(UnexposedTriggerRTO, { mode: 'lax' }), undefined)
})

Deno.test('RequiredWhen: a numeric or boolean value matches the submitted string and the transformed value', async () => {
  // `level` is transformed by `IsNumber` ('2' -> 2): both forms satisfy the same condition
  assertEquals(await refusals(TypedTriggerRTO, { level: '2' }), { a: ['a-required'] })
  assertEquals(await refusals(TypedTriggerRTO, { level: 2 }), { a: ['a-required'] })
  assertEquals(await refusals(TypedTriggerRTO, { level: 3 }), undefined)
  assertEquals(await refusals(TypedTriggerRTO, { level: '2', a: 'x' }), undefined)
  assertEquals(await refusals(TypedTriggerRTO, { flag: 'true' }), { b: ['b-required'] })
  assertEquals(await refusals(TypedTriggerRTO, { flag: 'false' }), undefined)
  assertEquals(await refusals(TypedTriggerRTO, { flag: 'true', b: 'x' }), undefined)
})

Deno.test('RequiredWhen: `each` requires a non-empty list of filled strings', async () => {
  const base = { intent: 'create', title: 't', defaulted: 'd' }
  assertEquals(await refusals(EachTransformRTO, { ...base, tags: ['a', 'b'] }), undefined)
  assertEquals(await refusals(EachTransformRTO, { ...base, tags: 'a' }), undefined) // one item
  assertEquals(await refusals(EachTransformRTO, base), { tags: ['tags-required'] })
  assertEquals(await refusals(EachTransformRTO, { ...base, tags: [] }), { tags: ['tags-required'] })
  assertEquals(await refusals(EachTransformRTO, { ...base, tags: ['a', ' '] }), {
    tags: ['tags-required'],
  })
  assertEquals(await refusals(EachTransformRTO, { ...base, tags: '' }), { tags: ['tags-required'] })
  // wrong item type (a custom message replaces the default one)
  assertEquals(await refusals(EachTransformRTO, { ...base, tags: ['a', 3] }), {
    tags: ['tags-required'],
  })
  // not required: anything of the type
  const other = { intent: 'delete' }
  assertEquals(await refusals(EachTransformRTO, other), undefined)
  assertEquals(await refusals(EachTransformRTO, { ...other, tags: [] }), undefined)
  assertEquals(await refusals(EachTransformRTO, { ...other, tags: ['', ' '] }), undefined)
  assertEquals(await refusals(EachTransformRTO, { ...other, tags: '' }), undefined)
})

Deno.test('RequiredWhen: `transform` runs before the check and its result is exposed', async () => {
  const ok = await classValidation(EachTransformRTO, {
    intent: 'create',
    tags: ['a'],
    title: '  hello  ',
    defaulted: 'd',
  })
  assertEquals(ok.title, 'hello')
  // blank after the transform
  assertEquals(
    await refusals(EachTransformRTO, {
      intent: 'create',
      tags: ['a'],
      title: '   ',
      defaulted: 'd',
    }),
    { title: ['title-required'] },
  )
  const deleted = await classValidation(EachTransformRTO, { intent: 'delete' })
  assertEquals(deleted.title, undefined)
})

Deno.test('RequiredWhen: reports a validation failure as a BAD_REQUEST HttpError', async () => {
  await assertRejects(
    () => classValidation(IntentFirstRTO, { intent: 'create' }),
    HttpError,
    'BAD_REQUEST',
  )
})

Deno.test('RequiredWhen: classMetadata reports it as optional, exposed, with its condition', () => {
  const fields = classMetadata(IntentFirstRTO)
  assertEquals(fields.line1.decorator, 'RequiredWhen')
  assertEquals(fields.line1.args, ['intent', 'create'])
  assertEquals(fields.line1.optional, true)
  assertEquals(fields.line1.expose, true)
  assertEquals(fields.phone.args, ['intent', ['create', 'update']])
  assertEquals(typeof fields.note.args[1], 'function')
  assertEquals(classMetadata(EachTransformRTO).tags.each, true)
})

Deno.test('RequiredWhen: a basic instance (no classValidation) assigns without validating', () => {
  const rto = new IntentFirstRTO()
  rto.line1 = undefined
  assertEquals(rto.line1, undefined)
  rto.line1 = 'x'
  assertEquals(rto.line1, 'x')
})

Deno.test('RequiredWhen: default messages with `each`, and errors of async validations are aggregated', async () => {
  assertEquals(await refusals(DefaultsAsyncRTO, { intent: 'create', checked: 'no' }), {
    tags: ["'tags' is required and must have at least one non-blank string."],
    name: ["'name' is required."],
    checked: ['async-failed'],
  })
  assertEquals(await refusals(DefaultsAsyncRTO, { intent: 'create', tags: [1], name: 'n' }), {
    tags: ["All values of 'tags' must be valid strings"],
  })
  assertEquals(await refusals(DefaultsAsyncRTO, { intent: 'delete', checked: 'ok' }), undefined)
})

Deno.test('RequiredWhen: works with `exposeValuesAsGetter` and without exposed defaults', async () => {
  const asGetter = await classValidation(IntentFirstRTO, {
    intent: 'create',
    line1: 'a',
    city: 'b',
    phone: 'c',
    note: 'd',
  }, { exposeValuesAsGetter: true })
  assertEquals(asGetter.line1, 'a')
  await assertRejects(
    () =>
      classValidation(IntentFirstRTO, { intent: 'create' }, {
        exposeValuesAsGetter: true,
        exposeDefaultsValues: false,
      }),
    HttpError,
  )
  const lax = await classValidation(IntentFirstRTO, { intent: 'delete', line1: 'x' }, {
    excludeExtraneousValues: false,
  })
  assertEquals(lax.line1, 'x')
})

Deno.test('RequiredWhen: successive validations do not leak state between them', async () => {
  assertEquals(await refusals(IntentFirstRTO, { intent: 'create' }) !== undefined, true)
  assertEquals(await refusals(IntentFirstRTO, { intent: 'delete' }), undefined)
  assertEquals(await refusals(IntentFirstRTO, { intent: 'create' }) !== undefined, true)
})
