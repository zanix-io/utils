import { assertMatch } from '@std/assert'
import { getISODate, getLocalTime, getUtcTime } from 'utils/dates.ts'
import { isoDateRegex, localTimeRegex, utcTimeRegex } from 'utils/regex.ts'

Deno.test('getLocalTime returns a valid time string', () => {
  const localTime = getLocalTime()
  assertMatch(localTime, localTimeRegex, 'Invalid local time format')
})

Deno.test('getUtcTime returns a valid UTC time', () => {
  const utcTime = getUtcTime()
  assertMatch(utcTime, utcTimeRegex, 'Invalid UTC time format')
})

Deno.test('getISODate returns a valid UTC time', () => {
  const isoDate = getISODate()
  assertMatch(isoDate, isoDateRegex, 'Invalid UTC time format')
})
