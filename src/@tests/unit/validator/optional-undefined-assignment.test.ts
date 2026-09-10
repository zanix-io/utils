import { assertEquals } from '@std/assert'
import { BaseRTO } from 'modules/validations/mod.ts'
import { IsString } from 'modules/validations/decorators/strings/is-string.ts'

/**
 * Regression coverage for a real, confirmed crash in `defineSetter`'s own accessor implementation
 * (`base/definitions/accessors.ts`): explicitly assigning `undefined` to an `optional` accessor
 * used to throw `Cannot read properties of undefined (reading 'constructor')` — the "basic
 * instance usage" fast path (`!this.constructor.prototype.validate`) unconditionally reached for
 * `val.constructor` to clear a stale `_initialized_` marker, with no guard for `val` itself being
 * nullish. Never assigning the accessor at all was always fine; only an EXPLICIT `undefined`
 * assignment crashed — confirmed via a real consumer (`@zanix/iam`'s own SDK,
 * `LoginClient.refresh(token?: string)`, doing `body.token = token` unconditionally).
 */
class OptionalFieldRTO extends BaseRTO {
  @IsString({ expose: true, optional: true })
  accessor token: string | undefined
}

Deno.test('assigning undefined to an optional accessor does not throw', () => {
  const instance = new OptionalFieldRTO()
  instance.token = undefined
  assertEquals(instance.token, undefined)
})

Deno.test('an optional accessor never assigned at all serializes with no key', () => {
  const instance = new OptionalFieldRTO()
  assertEquals(JSON.stringify(instance), '{}')
})

Deno.test('assigning undefined to an optional accessor also serializes with no key', () => {
  const instance = new OptionalFieldRTO()
  instance.token = undefined
  assertEquals(JSON.stringify(instance), '{}')
})

Deno.test('a real value assigned to the same optional accessor still validates and serializes', () => {
  const instance = new OptionalFieldRTO()
  instance.token = 'real-value'
  assertEquals(instance.token, 'real-value')
  assertEquals(JSON.stringify(instance), '{"token":"real-value"}')
})
