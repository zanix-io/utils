import {
  base64UrlDecode,
  base64UrlEncode,
  capitalize,
  capitalizeWords,
  stringToUint8Array,
  uint8ArrayToBase64,
  uint8ArrayToString,
} from 'utils/encoders.ts'
import { assertEquals, assertNotEquals } from '@std/assert'

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

Deno.test('array buffer encoding and decoding', () => {
  const exampleArrayBuffer = stringToUint8Array('Hello, world!')
  const resultString = atob(uint8ArrayToBase64(exampleArrayBuffer))

  assertEquals(resultString, 'Hello, world!')
})

Deno.test('base64 url encode should encode and decode correctly', () => {
  const input = 'Hello, world!'
  const resultString = base64UrlEncode(input)
  const decoded = base64UrlDecode(resultString)

  assertNotEquals(resultString, input)
  assertEquals(input, uint8ArrayToString(decoded))

  const stringDecoded = base64UrlDecode(resultString, true)

  assertEquals(input, stringDecoded)
})
