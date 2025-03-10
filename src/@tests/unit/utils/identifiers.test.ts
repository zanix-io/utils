import { assertMatch, assertNotEquals } from '@std/assert'
import { generateBasicUUID } from 'utils/identifiers.ts'
import regex from 'utils/regex.ts'

Deno.test('Validate get basic uuid', () => {
  assertMatch(generateBasicUUID(), regex.uuidRegex)
  assertNotEquals(generateBasicUUID(), generateBasicUUID())
})
