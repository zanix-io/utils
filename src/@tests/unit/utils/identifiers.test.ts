import { assertMatch, assertNotEquals } from '@std/assert'
import { generateUUID } from 'utils/identifiers.ts'
import { uuidRegex } from 'utils/regex.ts'

Deno.test('Validate get basic uuid', () => {
  assertMatch(generateUUID(), uuidRegex)
  assertNotEquals(generateUUID(), generateUUID())
})
