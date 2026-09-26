// deno-lint-ignore-file no-explicit-any
import { assertEquals } from '@std/assert'
import { isObject, isObjectArray } from 'modules/validations/decorators/generic/is-object.ts'

// ----------------------
// isObject tests
// ----------------------
Deno.test('isObject: accepts a plain object literal', () => {
  assertEquals(isObject({ a: 1 }), true)
})

Deno.test('isObject: accepts a class instance', () => {
  class Point {
    public x = 1
    public y = 2
  }
  assertEquals(isObject(new Point()), true)
})

Deno.test('isObject: accepts an empty object', () => {
  assertEquals(isObject({}), true)
})

Deno.test('isObject: rejects an array', () => {
  assertEquals(isObject([]), false)
  assertEquals(isObject([1, 2, 3]), false)
})

Deno.test('isObject: rejects null', () => {
  assertEquals(isObject(null), false)
})

Deno.test('isObject: rejects primitives', () => {
  assertEquals(isObject('string' as any), false)
  assertEquals(isObject(123 as any), false)
  assertEquals(isObject(true as any), false)
  assertEquals(isObject(undefined), false)
})

// ----------------------
// isObjectArray tests
// ----------------------
Deno.test('isObjectArray: valid array of objects', () => {
  assertEquals(isObjectArray([{ a: 1 }, { b: 2 }]), true)
})

Deno.test('isObjectArray: invalid array containing an array, null or primitive', () => {
  assertEquals(isObjectArray([{ a: 1 }, []]), false)
  assertEquals(isObjectArray([{ a: 1 }, null as any]), false)
  assertEquals(isObjectArray([{ a: 1 }, 'nope' as any]), false)
})
