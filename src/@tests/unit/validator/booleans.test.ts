// deno-lint-ignore-file
import { assertEquals, assertThrows } from '@std/assert'
import {
  IsBoolean,
  isBoolean,
  isBooleanArray,
} from 'modules/validations/decorators/generic/is-boolean.ts'

// ----------------------
// isBoolean tests
// ----------------------
Deno.test("isBoolean: receive 'true' as a boolean", () => {
  assertEquals(isBoolean('true'), true)
})

Deno.test("isBoolean: receive 'false' as a boolean", () => {
  assertEquals(isBoolean('false'), true)
})

Deno.test('isBoolean: should validate not valid booleans', () => {
  assertEquals(isBoolean('yes'), false)
  assertEquals(isBoolean('1'), false)
  assertEquals(isBoolean(''), false)
  assertEquals(isBoolean(undefined), false)
})

// ----------------------
// isBooleanArray test
// ----------------------
Deno.test('isBooleanArray: valid array', () => {
  assertEquals(isBooleanArray(['true', 'false', 'true']), true)
})

Deno.test('isBooleanArray: invalid array', () => {
  assertEquals(isBooleanArray(['true', 'nope']), false)
})
