import { assertEquals, assertThrows } from '@std/assert'
import { parseTTL } from 'utils/ttl.ts'

Deno.test('parseTTL: parses seconds (s)', () => {
  assertEquals(parseTTL('10s'), 10)
  assertEquals(parseTTL('1s'), 1)
})

Deno.test('parseTTL: parses minutes (m)', () => {
  assertEquals(parseTTL('1m'), 60)
  assertEquals(parseTTL('15m'), 900)
})

Deno.test('parseTTL: parses hours (h)', () => {
  assertEquals(parseTTL('1h'), 3600)
  assertEquals(parseTTL('2h'), 7200)
})

Deno.test('parseTTL: parses days (d)', () => {
  assertEquals(parseTTL('1d'), 86400)
  assertEquals(parseTTL('7d'), 604800)
})

Deno.test('parseTTL: parses weeks (w)', () => {
  assertEquals(parseTTL('1w'), 604800)
  assertEquals(parseTTL('2w'), 1209600)
})

Deno.test('parseTTL: parses months (mo)', () => {
  assertEquals(parseTTL('1mo'), 2592000)
  assertEquals(parseTTL('2mo'), 5184000)
})

Deno.test('parseTTL: parses years (y)', () => {
  assertEquals(parseTTL('1y'), 31536000)
})

Deno.test('parseTTL: accepts numeric seconds directly', () => {
  assertEquals(parseTTL(300), 300)
  assertEquals(parseTTL(0), 0)
})

Deno.test('parseTTL: trims spaces inside string', () => {
  assertEquals(parseTTL(' 10 s'), 10)
  assertEquals(parseTTL(' 5m '), 300)
})

Deno.test('parseTTL: throws on invalid formats', () => {
  assertThrows(() => parseTTL('abc'))
  assertThrows(() => parseTTL('10'))
  assertThrows(() => parseTTL('5minutes'))
  assertThrows(() => parseTTL('h'))
  assertThrows(() => parseTTL('1x'))
})

Deno.test('parseTTL: throws on empty string', () => {
  assertThrows(() => parseTTL(''))
})
