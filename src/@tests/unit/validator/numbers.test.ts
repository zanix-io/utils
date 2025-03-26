import { maxNumber, maxNumberArray } from 'modules/validations/decorators/numbers/max-number.ts'
import { minNumber, minNumberArray } from 'modules/validations/decorators/numbers/min-number.ts'
import { assertEquals } from '@std/assert'
import { isNumber } from 'modules/validations/decorators/numbers/is-number.ts'

Deno.test('Validates max number', () => {
  assertEquals(maxNumber(3, 2), true)
  assertEquals(maxNumber(3, 4), false)

  assertEquals(maxNumberArray(3, [1, 2, 3]), true)
  assertEquals(maxNumberArray(3, [1, 2, 4]), false)
})

Deno.test('Validates min number', () => {
  assertEquals(minNumber(1, 2), true)
  assertEquals(minNumber(5, 4), false)

  assertEquals(minNumberArray(1, [1, 2, 3]), true)
  assertEquals(minNumberArray(2, [1, 2, 4]), false)
})

Deno.test('Validates number', () => {
  assertEquals(isNumber(1), true)
  assertEquals(isNumber('4' as never), false)
  assertEquals(isNumber('4s' as never), false)
})
