import { maxDate, maxDateArray } from 'modules/validations/decorators/dates/max-date.ts'
import { minDate, minDateArray } from 'modules/validations/decorators/dates/min-date.ts'
import { isDate, isDateArray } from 'modules/validations/decorators/dates/is-date.ts'
import { assertEquals } from '@std/assert'

Deno.test('Validates max date', () => {
  assertEquals(maxDate(new Date('2023-01-01'), new Date('2020-01-01')), true)
  assertEquals(maxDate(new Date('2023-01-01'), new Date('2023-01-01')), true)
  assertEquals(maxDate(new Date('2023-01-01'), new Date('2024-01-01')), false)

  assertEquals(maxDateArray(new Date('2023-01-01'), new Date('2020-01-01') as never), false)
  assertEquals(
    maxDateArray(new Date('2023-01-01'), [new Date('2020-01-01'), new Date('2018-01-01')]),
    true,
  )
  assertEquals(
    maxDateArray(new Date('2023-01-01'), [new Date('2023-01-01'), new Date('2018-01-01')]),
    true,
  )
  assertEquals(
    maxDateArray(new Date('2023-01-01'), [new Date('2020-01-01'), new Date('2028-01-01')]),
    false,
  )
})

Deno.test('Validates min date', () => {
  assertEquals(minDate(new Date('2024-01-01'), new Date('2025-01-01')), true)
  assertEquals(minDate(new Date('2024-01-01'), new Date('2024-01-01')), true)
  assertEquals(minDate(new Date('2024-01-01'), new Date('2023-01-01')), false)

  assertEquals(minDateArray(new Date('2024-01-01'), new Date('2025-01-01') as never), false)
  assertEquals(
    minDateArray(new Date('2024-01-01'), [new Date('2024-01-01'), new Date('2025-01-01')]),
    true,
  )
  assertEquals(
    minDateArray(new Date('2024-01-01'), [new Date('2023-01-01'), new Date('2025-01-01')]),
    false,
  )
})

Deno.test('Validates is date', () => {
  assertEquals(isDate(new Date('2024-01-01')), true)
  assertEquals(isDate(0 as never), false)

  assertEquals(isDateArray(new Date('2025-01-01') as never), false)
  assertEquals(
    isDateArray([new Date('2024-01-01'), new Date('2025-01-01')]),
    true,
  )
  assertEquals(
    isDateArray([new Date('2023-01-01'), '2020-22-01'] as never),
    false,
  )
})
