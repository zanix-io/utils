// deno-lint-ignore-file
import { assertEquals, assertThrows } from '@std/assert'
import {
  isBooleanString,
  isBooleanStringArray,
} from 'modules/validations/decorators/strings/is-boolean-string.ts'
import { isBoolean, isBooleanArray } from 'modules/validations/decorators/generic/is-boolean.ts'

// ----------------------
// isBooleanString tests
// ----------------------
Deno.test("isBooleanString: receive 'true' as a boolean", () => {
  assertEquals(isBooleanString('true'), true)
})

Deno.test("isBooleanString: receive 'false' as a boolean", () => {
  assertEquals(isBooleanString('false'), true)
})

Deno.test('isBooleanString: should validate not valid booleans', () => {
  assertEquals(isBooleanString('yes'), false)
  assertEquals(isBooleanString('1'), false)
  assertEquals(isBooleanString(''), false)
  assertEquals(isBooleanString(undefined), false)
})

// ----------------------
// isBooleanStringArray test
// ----------------------
Deno.test('isBooleanStringArray: valid array', () => {
  assertEquals(isBooleanStringArray(['true', 'false', 'true']), true)
})

Deno.test('isBooleanStringArray: invalid array', () => {
  assertEquals(isBooleanStringArray(['true', 'nope']), false)
})

// ----------------------
// isBoolean tests
// ----------------------
Deno.test('isBoolean: receive true as a boolean', () => {
  assertEquals(isBoolean(true), true)
})

Deno.test('isBoolean: receive false as a boolean', () => {
  assertEquals(isBoolean(false), true)
})

Deno.test('isBoolean: should validate not valid booleans', () => {
  assertEquals(isBoolean('yes' as never), false)
  assertEquals(isBoolean(0 as never), false)
  assertEquals(isBoolean(1 as never), false)
  assertEquals(isBoolean(undefined), false)
})

// ----------------------
// isBooleanArray test
// ----------------------
Deno.test('isBooleanArray: valid array', () => {
  assertEquals(isBooleanArray([true, false, true]), true)
})

Deno.test('isBooleanArray: invalid array', () => {
  assertEquals(isBooleanArray([true, 'nope' as never]), false)
})
