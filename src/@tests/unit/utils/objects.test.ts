import { assertEquals } from '@std/assert'
import { isPlainObject } from 'utils/objects.ts'

Deno.test('isPlainObject accepts a real object literal', () => {
  assertEquals(isPlainObject({}), true)
  assertEquals(isPlainObject({ a: 1 }), true)
})

Deno.test({
  name: 'isPlainObject rejects a class instance (Date, custom class) even though it is an object',
  fn: () => {
    assertEquals(isPlainObject(new Date()), false)
    class Custom {}
    assertEquals(isPlainObject(new Custom()), false)
  },
})

Deno.test('isPlainObject rejects null, an array, and primitives', () => {
  assertEquals(isPlainObject(null), false)
  assertEquals(isPlainObject([1, 2, 3]), false)
  assertEquals(isPlainObject('object'), false)
  assertEquals(isPlainObject(42), false)
  assertEquals(isPlainObject(undefined), false)
})
