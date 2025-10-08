import { capitalize, capitalizeWords, generateHashHex } from 'utils/strings.ts'
import { assertEquals } from '@std/assert'

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

Deno.test('generate hash', async () => {
  assertEquals(
    await generateHashHex('text value'),
    'ffabc3fe711165f0a9acd034603b7c4dace74cbe643409a89ab62c9c3a87c4a8',
  )
})
