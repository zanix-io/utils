import { assertEquals, assertExists } from '@std/assert'
import { defaultTransform } from 'modules/validations/decorators/numbers/defaults.ts'

Deno.test('defaultTransform returns undefined when disabled', () => {
  assertEquals(defaultTransform(false), undefined)
})

Deno.test('defaultTransform converts numeric strings and ignores invalid or missing values', () => {
  const transform = defaultTransform(true)
  assertExists(transform)

  assertEquals(transform('42'), 42)
  assertEquals(transform(undefined), undefined)
  assertEquals(transform('not-a-number'), undefined)
})
