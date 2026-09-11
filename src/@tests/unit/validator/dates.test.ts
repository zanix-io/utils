import { maxDate, maxDateArray } from 'modules/validations/decorators/dates/max-date.ts'
import { minDate, minDateArray } from 'modules/validations/decorators/dates/min-date.ts'
import { minAge, minAgeArray } from 'modules/validations/decorators/dates/min-age.ts'
import { maxAge, maxAgeArray } from 'modules/validations/decorators/dates/max-age.ts'
import { isDate, isDateArray } from 'modules/validations/decorators/dates/is-date.ts'
import { assertEquals } from '@std/assert'
import { FakeTime } from '@std/testing/time'

Deno.test('Validates max date', () => {
  assertEquals(maxDate(new Date('2023-01-01'), new Date('2020-01-01')), true)
  assertEquals(maxDate(new Date('2023-01-01'), new Date('2023-01-01')), true)
  assertEquals(maxDate(new Date('2023-01-01'), new Date('2024-01-01')), false)

  assertEquals(
    maxDateArray(new Date('2023-01-01'), new Date('2020-01-01') as never),
    false,
  )
  assertEquals(
    maxDateArray(new Date('2023-01-01'), [
      new Date('2020-01-01'),
      new Date('2018-01-01'),
    ]),
    true,
  )
  assertEquals(
    maxDateArray(new Date('2023-01-01'), [
      new Date('2023-01-01'),
      new Date('2018-01-01'),
    ]),
    true,
  )
  assertEquals(
    maxDateArray(new Date('2023-01-01'), [
      new Date('2020-01-01'),
      new Date('2028-01-01'),
    ]),
    false,
  )
})

Deno.test('Validates min date', () => {
  assertEquals(minDate(new Date('2024-01-01'), new Date('2025-01-01')), true)
  assertEquals(minDate(new Date('2024-01-01'), new Date('2024-01-01')), true)
  assertEquals(minDate(new Date('2024-01-01'), new Date('2023-01-01')), false)

  assertEquals(
    minDateArray(new Date('2024-01-01'), new Date('2025-01-01') as never),
    false,
  )
  assertEquals(
    minDateArray(new Date('2024-01-01'), [
      new Date('2024-01-01'),
      new Date('2025-01-01'),
    ]),
    true,
  )
  assertEquals(
    minDateArray(new Date('2024-01-01'), [
      new Date('2023-01-01'),
      new Date('2025-01-01'),
    ]),
    false,
  )
})

// `MinAge`/`MaxAge` deliberately recompute their threshold from `new Date()` on every single call
// (see both decorators' own doc — it's what keeps an age check from ever going stale). That design
// makes a real, once-observed-in-CI flake possible here: `today` is captured once, but `minAge`/
// `minAgeArray` below each independently call `new Date()` again a few instructions later — with no
// `FakeTime`, a boundary fixture built to land EXACTLY on the threshold can drift to the wrong side
// of it purely from the real wall-clock milliseconds elapsed between building the fixture and the
// decorator's own later `new Date()` call, with no code defect involved. `FakeTime` freezes `Date`
// for the whole test, so every `new Date()` call — the fixture's and the decorator's — observes the
// identical instant, making the exact-boundary case deterministic instead of a real timing race.
Deno.test('Validates min age', () => {
  using _time = new FakeTime(new Date('2024-06-15T12:00:00Z'))
  const today = new Date()

  const exactly18 = new Date(today)
  exactly18.setFullYear(exactly18.getFullYear() - 18)

  const oneDayShortOf18 = new Date(exactly18)
  oneDayShortOf18.setDate(oneDayShortOf18.getDate() + 1)

  const wellOver18 = new Date(today)
  wellOver18.setFullYear(wellOver18.getFullYear() - 30)

  assertEquals(minAge(18, exactly18), true)
  assertEquals(minAge(18, wellOver18), true)
  assertEquals(minAge(18, oneDayShortOf18), false)
  assertEquals(minAge(18, undefined), false)
  assertEquals(minAge(18, new Date('invalid')), false)

  assertEquals(minAgeArray(18, wellOver18 as never), false)
  assertEquals(minAgeArray(18, [exactly18, wellOver18]), true)
  assertEquals(minAgeArray(18, [exactly18, oneDayShortOf18]), false)
})

// Same real timing-race reasoning as `Validates min age` above — `FakeTime` freezes `Date` so
// `maxAgeArray`'s own later `new Date()` call can't drift past the fixture's exact boundary.
Deno.test('Validates max age', () => {
  using _time = new FakeTime(new Date('2024-06-15T12:00:00Z'))
  const today = new Date()

  const exactly120 = new Date(today)
  exactly120.setFullYear(exactly120.getFullYear() - 120)

  const oneDayPast120 = new Date(exactly120)
  oneDayPast120.setDate(oneDayPast120.getDate() - 1)

  const wellUnder120 = new Date(today)
  wellUnder120.setFullYear(wellUnder120.getFullYear() - 30)

  assertEquals(maxAge(120, exactly120), true)
  assertEquals(maxAge(120, wellUnder120), true)
  assertEquals(maxAge(120, oneDayPast120), false)
  assertEquals(maxAge(120, undefined), false)
  assertEquals(maxAge(120, new Date('invalid')), false)

  assertEquals(maxAgeArray(120, wellUnder120 as never), false)
  assertEquals(maxAgeArray(120, [exactly120, wellUnder120]), true)
  assertEquals(maxAgeArray(120, [exactly120, oneDayPast120]), false)
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
