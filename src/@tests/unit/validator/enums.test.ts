// deno-lint-ignore-file no-explicit-any
// isEnum.test.ts

import { isEnum, isEnumArray } from 'modules/validations/decorators/generic/is-enum.ts'
import { assert } from '@std/assert'

enum TestEnum {
  A = 'A',
  B = 'B',
  C = 'C',
}

Deno.test('isEnum - returns true for valid enum values', () => {
  assert(isEnum('A', TestEnum))
  assert(isEnum('B', TestEnum))
})

Deno.test('isEnum - returns false for invalid values', () => {
  assert(!isEnum('Z', TestEnum))
  assert(!isEnum(undefined, TestEnum))
  assert(!isEnum(123, TestEnum))
})

Deno.test('isEnumArray - returns true for arrays with valid enum values', () => {
  assert(isEnumArray(['A', 'B'], TestEnum))
})

Deno.test('isEnumArray - returns false for arrays containing invalid values', () => {
  assert(!isEnumArray(['A', 'Z'], TestEnum))
  assert(!isEnumArray(['Z'], TestEnum))
})

Deno.test('isEnumArray - returns false for non-array inputs', () => {
  assert(!isEnumArray('A' as any, TestEnum))
  assert(!isEnumArray(123 as any, TestEnum))
  assert(!isEnumArray(null as any, TestEnum))
})

Deno.test('isEnum - using array values', () => {
  assert(isEnum('value a', ['value a', 'value b']))
  assert(!isEnum('value', ['value a', 'value b']))
})

Deno.test('isEnumArray - using array values', () => {
  assert(isEnumArray(['value a', 'value b'], ['value a', 'value b']))
  assert(!isEnumArray(['value bs'], ['value a', 'value b']))
})
