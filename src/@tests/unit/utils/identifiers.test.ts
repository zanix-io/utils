import { assertMatch, assertNotEquals } from '@std/assert'
import { generateBasicUUID } from 'utils/identifiers.ts'
import { uuidRegex } from 'utils/regex.ts'

Deno.test('Validate get basic uuid', () => {
  assertMatch(generateBasicUUID(), uuidRegex)
  assertNotEquals(generateBasicUUID(), generateBasicUUID())
})
