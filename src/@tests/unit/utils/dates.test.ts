import { assertMatch } from '@std/assert'
import { getISODate, getLocalTime, getUtcTime } from 'utils/dates.ts'
import regex from 'utils/regex.ts'

Deno.test('getLocalTime returns a valid time string', () => {
  const localTime = getLocalTime()
  assertMatch(localTime, regex.localTimeRegex, 'Invalid local time format')
})

Deno.test('getUtcTime returns a valid UTC time', () => {
  const utcTime = getUtcTime()
  assertMatch(utcTime, regex.utcTimeRegex, 'Invalid UTC time format')
})

Deno.test('getISODate returns a valid UTC time', () => {
  const isoDate = getISODate()
  assertMatch(isoDate, regex.isoDateRegex, 'Invalid UTC time format')
})
