import { assertEquals } from '@std/assert'
import { capitalize, capitalizeWords } from 'utils/strings.ts'

Deno.test('capitalize should capitalize the first character of a string', () => {
  assertEquals(capitalize('hello'), 'Hello')
  assertEquals(capitalize('world'), 'World')
  assertEquals(capitalize(''), '') // Empty string should return empty string
})

Deno.test('capitalizeWords should capitalize the first letter of each word', () => {
  assertEquals(capitalizeWords('hello world'), 'Hello World')
  assertEquals(capitalizeWords('the quick brown fox'), 'The Quick Brown Fox')
  assertEquals(capitalizeWords('hello'), 'Hello')
  assertEquals(capitalizeWords(''), '') // Empty string should return empty string
})
