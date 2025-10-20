import {
  capitalize,
  capitalizeWords,
  stringToUint8Array,
  uint8ArrayToBase64,
} from 'utils/strings.ts'
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

Deno.test('array buffer encoding and decoding', () => {
  const exampleArrayBuffer = stringToUint8Array('Hello, world!')
  const resultString = atob(uint8ArrayToBase64(exampleArrayBuffer))

  assertEquals(resultString, 'Hello, world!')
})
