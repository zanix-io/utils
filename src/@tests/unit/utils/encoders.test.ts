import { assertEquals, assertNotEquals, assertThrows } from '@std/assert'
import { ApplicationError } from 'modules/errors/main.ts'
import {
  base32Decode,
  base32Encode,
  base64UrlDecode,
  base64UrlEncode,
  capitalize,
  capitalizeWords,
  compareUint8Arrays,
  hexToUint8Array,
  stringToUint8Array,
  stripComments,
  uint8ArrayToBase64,
  uint8ArrayToString,
} from 'utils/encoders.ts'

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

Deno.test('stripComments removes block and line comments but keeps quoted content', () => {
  assertEquals(stripComments('/* block comment */{"a": 1}'), '{"a": 1}')
  assertEquals(stripComments('  // full line comment\n{"a": 1}'), '\n{"a": 1}')
  assertEquals(stripComments('{"a": 1} // trailing comment'), '{"a": 1}')
  assertEquals(
    stripComments('{"note": "//not a comment"}'),
    '{"note": "//not a comment"}',
  )
})

Deno.test('stripComments does not corrupt a block-comment-shaped glob inside a JSON string', () => {
  // Regression: a `test.include` glob whose value contains a `/*...*/`-shaped substring must
  // survive untouched — it previously got misread as a real block comment and stripped down to
  // `"src/@tests*.test.ts"`.
  assertEquals(
    stripComments('{"include": ["src/@tests/**/*.test.ts"]}'),
    '{"include": ["src/@tests/**/*.test.ts"]}',
  )
})

Deno.test('stripComments strips a real block comment adjacent to /* */-shaped string content', () => {
  assertEquals(
    stripComments('/* real comment */{"note": "a /* fake */ b"}'),
    '{"note": "a /* fake */ b"}',
  )
})

Deno.test('stripComments is not narrowly special-cased to a single occurrence', () => {
  // Two separate /**/-shaped globs in the same string, plus a real trailing comment — confirms
  // the fix is a genuine string-boundary rule, not a fix tailored to one reported string.
  assertEquals(
    stripComments('{"include": ["a/**/*.ts", "b/**/*.ts"]} // trailing'),
    '{"include": ["a/**/*.ts", "b/**/*.ts"]}',
  )
})

Deno.test('stripComments leaves an unterminated block comment untouched', () => {
  assertEquals(stripComments('{"a": 1} /* never closed'), '{"a": 1} /* never closed')
})

Deno.test('array buffer encoding and decoding', () => {
  const exampleArrayBuffer = stringToUint8Array('Hello, world!')
  const resultString = atob(uint8ArrayToBase64(exampleArrayBuffer))

  assertEquals(resultString, 'Hello, world!')
})

Deno.test('hexToUint8Array converts hex strings and rejects odd length', () => {
  assertEquals(hexToUint8Array('48 65'), new Uint8Array([0x48, 0x65]))
  assertEquals(hexToUint8Array('FF00'), new Uint8Array([0xff, 0x00]))

  const error = assertThrows(
    () => hexToUint8Array('abc'),
    ApplicationError,
    'Hex string must have an even length',
  )
  assertEquals(error.code, 'UTILS_ENCODERS_HEX_ODD_LENGTH')
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

Deno.test('base32Encode matches the RFC 4648 test vectors (unpadded)', () => {
  const encode = (s: string) => base32Encode(stringToUint8Array(s))

  assertEquals(encode(''), '')
  assertEquals(encode('f'), 'MY')
  assertEquals(encode('fo'), 'MZXQ')
  assertEquals(encode('foo'), 'MZXW6')
  assertEquals(encode('foob'), 'MZXW6YQ')
  assertEquals(encode('foobar'), 'MZXW6YTBOI')
})

Deno.test('base32Decode reverses base32Encode, tolerating lowercase and padding', () => {
  assertEquals(uint8ArrayToString(base32Decode('MZXW6YTBOI')), 'foobar')
  assertEquals(uint8ArrayToString(base32Decode('mzxw6ytboi')), 'foobar') // lowercase
  assertEquals(uint8ArrayToString(base32Decode('MZXW6YQ=')), 'foob') // padded

  const error = assertThrows(
    () => base32Decode('this-is-not-base32!'),
    ApplicationError,
    'Invalid Base32 character',
  )
  assertEquals(error.code, 'UTILS_ENCODERS_BASE32_INVALID_CHAR')
})

Deno.test('compareUint8Arrays: equal arrays return true', () => {
  assertEquals(compareUint8Arrays(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3])), true)
})

Deno.test('compareUint8Arrays: same length, different content returns false', () => {
  assertEquals(compareUint8Arrays(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 9])), false)
})

Deno.test('compareUint8Arrays: different length returns false', () => {
  assertEquals(compareUint8Arrays(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2])), false)
})

Deno.test('compareUint8Arrays: empty arrays are equal', () => {
  assertEquals(compareUint8Arrays(new Uint8Array([]), new Uint8Array([])), true)
})

/**
 * Regression coverage for a confirmed timing side-channel: comparing a secret (e.g. an HMAC
 * signature, via `verifyHMAC`) against caller-supplied input with an early-exit loop lets a
 * remote attacker recover the secret one byte at a time, since a guess whose leading bytes match
 * takes measurably longer to reject than one that doesn't. Proven structurally — every index is
 * read regardless of where (or whether) a mismatch occurs — rather than by timing, which is flaky
 * in CI and never a reliable regression signal.
 */
Deno.test('compareUint8Arrays: reads every index, even after an early mismatch', () => {
  const a = new Uint8Array([1, 2, 3, 4, 5])
  const readIndices: number[] = []
  // Mismatches at index 0 — an early-exit comparison would read only that one index from `b`.
  const target = new Uint8Array([9, 2, 3, 4, 5])
  const b = new Proxy(target, {
    get(obj, prop) {
      if (typeof prop === 'string' && /^\d+$/.test(prop)) readIndices.push(Number(prop))
      // Reflect.get's receiver must be the real TypedArray, not the Proxy: the `.length`
      // accessor on `%TypedArray.prototype%` checks its `this` has a genuine internal
      // TypedArray slot, which a Proxy never has.
      return Reflect.get(obj, prop, obj)
    },
  })

  compareUint8Arrays(a, b)

  assertEquals(readIndices, [0, 1, 2, 3, 4])
})
