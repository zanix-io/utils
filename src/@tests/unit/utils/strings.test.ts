import {
  base64UrlDecode,
  base64UrlEncode,
  capitalize,
  capitalizeWords,
  hexToUint8Array,
  stringToUint8Array,
  stripComments,
  uint8ArrayToBase64,
  uint8ArrayToString,
} from 'utils/encoders.ts'
import { assertEquals, assertNotEquals, assertThrows } from '@std/assert'

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

Deno.test('stripComments removes block and line comments but keeps quoted content', () => {
  assertEquals(stripComments('/* block comment */{"a": 1}'), '{"a": 1}')
  assertEquals(stripComments('  // full line comment\n{"a": 1}'), '\n{"a": 1}')
  assertEquals(stripComments('{"a": 1} // trailing comment'), '{"a": 1}')
  assertEquals(stripComments('{"note": "//not a comment"}'), '{"note": "//not a comment"}')
})

Deno.test('hexToUint8Array converts hex strings and rejects odd length', () => {
  assertEquals(hexToUint8Array('48 65'), new Uint8Array([0x48, 0x65]))
  assertEquals(hexToUint8Array('FF00'), new Uint8Array([0xff, 0x00]))

  assertThrows(() => hexToUint8Array('abc'), Error, 'Hex string must have an even length')
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
