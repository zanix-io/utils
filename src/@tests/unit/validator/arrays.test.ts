import { isArray, isArrayOfArray } from 'modules/validations/decorators/arrays/is-array.ts'
import { arrayLength } from 'modules/validations/decorators/arrays/length.ts'
import { assertEquals } from '@std/assert'

Deno.test('Validates array length. Min should be 1 at least', () => {
  assertEquals(arrayLength([], 0, 1), false) // min should be 1
  assertEquals(arrayLength([2, 3], 1, 2), true)
  assertEquals(arrayLength([2, 3, 4], 3, 5), true)
  assertEquals(arrayLength([2, 3, 4], 1, 2), false)
})

Deno.test('Validates if is array and array of arrays.', () => {
  assertEquals(isArray([]), true)
  assertEquals(isArray([2, 3]), true)
  assertEquals(isArray(5 as never), false)

  assertEquals(isArrayOfArray([2, 3, 4] as never), false)
  assertEquals(isArrayOfArray([[2], [3], [4]]), true)
})
