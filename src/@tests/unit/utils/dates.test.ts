import { assertMatch } from '@std/assert'
import { getISODate, getLocalTime, getUtcTime } from 'utils/dates.ts'
import { ISO_DATE_REGEX, LOCAL_TIME_REGEX, UTC_TIME_REGEX } from 'utils/regex.ts'

Deno.test('getLocalTime returns a valid time string', () => {
  const localTime = getLocalTime()
  assertMatch(localTime, LOCAL_TIME_REGEX, 'Invalid local time format')
})

Deno.test('getUtcTime returns a valid UTC time', () => {
  const utcTime = getUtcTime()
  assertMatch(utcTime, UTC_TIME_REGEX, 'Invalid UTC time format')
})

Deno.test('getISODate returns a valid UTC time', () => {
  const isoDate = getISODate()
  assertMatch(isoDate, ISO_DATE_REGEX, 'Invalid UTC time format')
})
