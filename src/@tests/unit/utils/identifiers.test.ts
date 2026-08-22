import { assertMatch, assertNotEquals } from '@std/assert'
import { generateUUID } from 'utils/identifiers.ts'
import { UUID_REGEX } from 'utils/regex.ts'

Deno.test('Validate get basic uuid', () => {
  assertMatch(generateUUID(), UUID_REGEX)
  assertNotEquals(generateUUID(), generateUUID())
})
