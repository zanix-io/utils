import { assertEquals, assertRejects, assertThrows } from '@std/assert'
import { ApplicationError } from 'modules/errors/main.ts'
import {
  assertContentLengthWithinLimit,
  assertNoCrlf,
  getClientIp,
  isIpInCidr,
  parseCidr,
  readBoundedStream,
} from 'utils/network.ts'

/** Builds a `ReadableStream<Uint8Array>` that yields `chunks` one at a time — used to exercise
 * {@linkcode readBoundedStream} without depending on a real `Request`/network stream. */
function streamOf(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  let i = 0
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(chunks[i++])
      } else {
        controller.close()
      }
    },
  })
}

Deno.test('isIpInCidr: exact match with a bare IP (implicit /32)', () => {
  assertEquals(isIpInCidr('203.0.113.5', '203.0.113.5'), true)
  assertEquals(isIpInCidr('203.0.113.6', '203.0.113.5'), false)
})

Deno.test('isIpInCidr: IP inside a /8 range', () => {
  assertEquals(isIpInCidr('10.0.4.12', '10.0.0.0/8'), true)
  assertEquals(isIpInCidr('192.168.1.1', '10.0.0.0/8'), false)
})

Deno.test('isIpInCidr: IP inside a /24 range, at the boundary', () => {
  assertEquals(isIpInCidr('192.168.1.0', '192.168.1.0/24'), true)
  assertEquals(isIpInCidr('192.168.1.255', '192.168.1.0/24'), true)
  assertEquals(isIpInCidr('192.168.2.1', '192.168.1.0/24'), false)
})

Deno.test('isIpInCidr: /0 matches every valid IPv4 address', () => {
  assertEquals(isIpInCidr('8.8.8.8', '0.0.0.0/0'), true)
  assertEquals(isIpInCidr('255.255.255.255', '0.0.0.0/0'), true)
})

Deno.test('isIpInCidr: /32 requires an exact match', () => {
  assertEquals(isIpInCidr('10.0.0.1', '10.0.0.1/32'), true)
  assertEquals(isIpInCidr('10.0.0.2', '10.0.0.1/32'), false)
})

Deno.test('isIpInCidr: malformed IP returns false', () => {
  assertEquals(isIpInCidr('not-an-ip', '10.0.0.0/8'), false)
  assertEquals(isIpInCidr('10.0.0.256', '10.0.0.0/8'), false)
  assertEquals(isIpInCidr('10.0.0', '10.0.0.0/8'), false)
  assertEquals(isIpInCidr('10.0.0.abc', '10.0.0.0/8'), false)
})

Deno.test('isIpInCidr: malformed CIDR returns false', () => {
  assertEquals(isIpInCidr('10.0.0.1', 'not-a-cidr/8'), false)
  assertEquals(isIpInCidr('10.0.0.1', '10.0.0.0/33'), false)
  assertEquals(isIpInCidr('10.0.0.1', '10.0.0.0/-1'), false)
  assertEquals(isIpInCidr('10.0.0.1', '10.0.0.0/abc'), false)
})

Deno.test('isIpInCidr: IPv6 input is unsupported and always returns false', () => {
  assertEquals(isIpInCidr('::1', '::1'), false)
  assertEquals(isIpInCidr('10.0.0.1', '::/0'), false)
})

Deno.test('getClientIp: prefers x-forwarded-for, using only the first entry', () => {
  const headers = new Headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' })
  assertEquals(getClientIp(headers), '203.0.113.5')
})

Deno.test('getClientIp: falls back to cf-connecting-ip when x-forwarded-for is absent', () => {
  const headers = new Headers({ 'cf-connecting-ip': '203.0.113.9' })
  assertEquals(getClientIp(headers), '203.0.113.9')
})

Deno.test('getClientIp: falls back to x-real-ip when the other two are absent', () => {
  const headers = new Headers({ 'x-real-ip': '203.0.113.10' })
  assertEquals(getClientIp(headers), '203.0.113.10')
})

Deno.test('getClientIp: falls back to "unknown-ip" when no header is present', () => {
  assertEquals(getClientIp(new Headers()), 'unknown-ip')
})

Deno.test('isIpInCidr: handles /31 correctly', () => {
  assertEquals(isIpInCidr('192.168.1.0', '192.168.1.0/31'), true)
  assertEquals(isIpInCidr('192.168.1.1', '192.168.1.0/31'), true)
  assertEquals(isIpInCidr('192.168.1.2', '192.168.1.0/31'), false)
})

Deno.test('isIpInCidr: rejects malformed CIDRs with extra separators', () => {
  assertEquals(isIpInCidr('10.0.0.1', '10.0.0.0/24/1'), false)
})

Deno.test('getClientIp: trims whitespace around x-forwarded-for', () => {
  const headers = new Headers({
    'x-forwarded-for': ' 203.0.113.5  , 10.0.0.1 ',
  })

  assertEquals(getClientIp(headers), '203.0.113.5')
})

Deno.test('getClientIp: trims whitespace from cf-connecting-ip', () => {
  const headers = new Headers({
    'cf-connecting-ip': ' 203.0.113.9 ',
  })

  assertEquals(getClientIp(headers), '203.0.113.9')
})

Deno.test('getClientIp: trims whitespace from x-real-ip', () => {
  const headers = new Headers({
    'x-real-ip': ' 203.0.113.10 ',
  })

  assertEquals(getClientIp(headers), '203.0.113.10')
})

Deno.test('getClientIp: normalizes IPv4-mapped IPv6 addresses', () => {
  const headers = new Headers({
    'cf-connecting-ip': '::ffff:203.0.113.5',
  })

  assertEquals(getClientIp(headers), '203.0.113.5')
})

Deno.test('getClientIp: removes port from IPv4 addresses', () => {
  const headers = new Headers({
    'cf-connecting-ip': '203.0.113.5:443',
  })

  assertEquals(getClientIp(headers), '203.0.113.5')
})

Deno.test('getClientIp: preserves IPv6 addresses', () => {
  const headers = new Headers({
    'cf-connecting-ip': '2001:db8::1',
  })

  assertEquals(getClientIp(headers), '2001:db8::1')
})

Deno.test('getClientIp: respects the configured trusted header order', () => {
  const headers = new Headers({
    'cf-connecting-ip': '203.0.113.5',
    'x-real-ip': '203.0.113.6',
  })

  assertEquals(
    getClientIp(headers, ['x-real-ip', 'cf-connecting-ip']),
    '203.0.113.6',
  )
})

Deno.test('getClientIp: skips missing trusted headers', () => {
  const headers = new Headers({
    'x-real-ip': '203.0.113.10',
  })

  assertEquals(
    getClientIp(headers, ['cf-connecting-ip', 'x-real-ip']),
    '203.0.113.10',
  )
})

Deno.test('getClientIp: returns unknown-ip when trusted header list is empty', () => {
  const headers = new Headers({
    'cf-connecting-ip': '203.0.113.5',
  })

  assertEquals(getClientIp(headers, []), 'unknown-ip')
})

Deno.test('isIpInCidr: malformed CIDR returns false', () => {
  assertEquals(isIpInCidr('10.0.0.1', 'not-a-cidr/8'), false)
  assertEquals(isIpInCidr('10.0.0.1', '10.0.0.0/33'), false)
  assertEquals(isIpInCidr('10.0.0.1', '10.0.0.0/-1'), false)
  assertEquals(isIpInCidr('10.0.0.1', '10.0.0.0/abc'), false)

  // Extra separators
  assertEquals(isIpInCidr('10.0.0.1', '10.0.0.0/24/1'), false)
  assertEquals(isIpInCidr('10.0.0.1', '10.0.0.0//24'), false)
  assertEquals(isIpInCidr('10.0.0.1', '10.0.0.0/24/'), false)

  // Missing network
  assertEquals(isIpInCidr('10.0.0.1', '/24'), false)

  // Empty CIDR
  assertEquals(isIpInCidr('10.0.0.1', ''), false)
})

Deno.test('isIpInCidr: rejects non-canonical CIDR ranges', () => {
  assertEquals(
    isIpInCidr('10.0.1.10', '10.0.1.55/24'),
    false,
  )
})

Deno.test('parseCidr: accepts canonical CIDR network addresses', () => {
  assertEquals(parseCidr('10.0.0.0/8') !== undefined, true)
  assertEquals(parseCidr('192.168.1.0/24') !== undefined, true)
  assertEquals(parseCidr('203.0.113.5/32') !== undefined, true)
})

Deno.test('parseCidr: rejects non-canonical CIDR network addresses', () => {
  assertEquals(parseCidr('10.0.0.15/8'), undefined)
  assertEquals(parseCidr('192.168.1.55/24'), undefined)
  assertEquals(parseCidr('172.16.10.20/16'), undefined)
})

Deno.test('parseCidr: accepts bare IPv4 as implicit /32', () => {
  const cidr = parseCidr('203.0.113.5')

  assertEquals(cidr !== undefined, true)
  assertEquals(cidr?.mask, 0xffffffff)
})

Deno.test('parseCidr: /0 accepts only the canonical network address', () => {
  assertEquals(parseCidr('0.0.0.0/0') !== undefined, true)
  assertEquals(parseCidr('10.0.0.0/0'), undefined)
})

Deno.test('parseCidr: rejects malformed CIDR notation', () => {
  assertEquals(parseCidr('10.0.0.0/24/1'), undefined)
  assertEquals(parseCidr('10.0.0.0//24'), undefined)
  assertEquals(parseCidr('/24'), undefined)
})

Deno.test('getClientIp: ignores empty trusted header values', () => {
  const headers = new Headers({
    'cf-connecting-ip': '',
    'x-real-ip': '203.0.113.10',
  })

  assertEquals(getClientIp(headers), '203.0.113.10')
})

Deno.test('getClientIp: ignores whitespace-only trusted header values', () => {
  const headers = new Headers({
    'cf-connecting-ip': '   ',
    'x-real-ip': '203.0.113.10',
  })

  assertEquals(getClientIp(headers), '203.0.113.10')
})

Deno.test({
  name: 'getClientIp: ignores empty first x-forwarded-for entry and uses next trusted header',
  fn: () => {
    const headers = new Headers({
      'x-forwarded-for': ', 10.0.0.1',
      'x-real-ip': '203.0.113.10',
    })

    assertEquals(getClientIp(headers), '203.0.113.10')
  },
})

Deno.test('getClientIp: returns unknown-ip when all trusted headers are empty', () => {
  const headers = new Headers({
    'cf-connecting-ip': '',
    'x-real-ip': '   ',
    'x-forwarded-for': ',',
  })

  assertEquals(getClientIp(headers), 'unknown-ip')
})

Deno.test('assertNoCrlf accepts an ordinary value', () => {
  assertNoCrlf('subject', 'Hello world')
})

Deno.test('assertNoCrlf rejects a value carrying an injected line, CRLF/bare-LF/CR alike', () => {
  const error = assertThrows(
    () => assertNoCrlf('subject', 'Hi\r\nBcc: attacker@evil.com'),
    ApplicationError,
    'Invalid subject: must not contain line breaks',
  )
  assertEquals(error.code, 'UTILS_NETWORK_CRLF_INJECTION')
  // Never auto-logged (InternalError's default `shouldLog:true` would be) — this is a hot,
  // low-level validator; every caller-side format mistake auto-logging would be unwanted noise,
  // not a real operator signal. `ApplicationError` defaults `shouldLog:false`.
  assertEquals((error as unknown as { _logged: boolean })._logged, false)
  assertThrows(() => assertNoCrlf('to', 'a@b.com\nBcc: c@d.com'), ApplicationError)
  assertThrows(() => assertNoCrlf('from', 'a@b.com\rBcc: c@d.com'), ApplicationError)
})

Deno.test('assertContentLengthWithinLimit: does not throw when within the limit', () => {
  assertContentLengthWithinLimit('1024', 2048)
  assertContentLengthWithinLimit(1024, 2048)
})

Deno.test('assertContentLengthWithinLimit: does not throw when exactly at the limit', () => {
  assertContentLengthWithinLimit('2048', 2048)
  assertContentLengthWithinLimit(2048, 2048)
})

Deno.test('assertContentLengthWithinLimit: throws when the declared size exceeds the limit', () => {
  const error = assertThrows(
    () => assertContentLengthWithinLimit('4096', 2048),
    ApplicationError,
    'Content-Length declares 4096 bytes, exceeding the 2048-byte limit',
  )
  assertEquals(error.code, 'UTILS_NETWORK_CONTENT_LENGTH_TOO_LARGE')
  assertEquals(error.meta, { declaredBytes: 4096, maxBytes: 2048 })
})

Deno.test('assertContentLengthWithinLimit: throws given an already-parsed oversized number', () => {
  assertThrows(
    () => assertContentLengthWithinLimit(4096, 2048),
    ApplicationError,
  )
})

Deno.test('assertContentLengthWithinLimit: null/undefined/empty never throw', () => {
  assertContentLengthWithinLimit(null, 1)
  assertContentLengthWithinLimit(undefined, 1)
  assertContentLengthWithinLimit('', 1)
})

Deno.test('assertContentLengthWithinLimit: a non-numeric value never throws', () => {
  assertContentLengthWithinLimit('not-a-number', 1)
})

Deno.test('readBoundedStream: returns accumulated bytes when under the limit', async () => {
  const stream = streamOf([new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])])
  const result = await readBoundedStream(stream, 10)
  assertEquals(result, new Uint8Array([1, 2, 3, 4, 5]))
})

Deno.test('readBoundedStream: accepts a payload landing exactly on the limit', async () => {
  const stream = streamOf([new Uint8Array([1, 2, 3])])
  const result = await readBoundedStream(stream, 3)
  assertEquals(result, new Uint8Array([1, 2, 3]))
})

Deno.test('readBoundedStream: returns an empty Uint8Array for an empty stream', async () => {
  const stream = streamOf([])
  const result = await readBoundedStream(stream, 10)
  assertEquals(result, new Uint8Array())
})

Deno.test('readBoundedStream: cancels the reader once real bytes exceed maxBytes', async () => {
  let cancelled = false
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      controller.enqueue(new Uint8Array([1, 2, 3, 4, 5]))
    },
    cancel() {
      cancelled = true
    },
  })

  const error = await assertRejects(
    () => readBoundedStream(stream, 3),
    ApplicationError,
    'Request body exceeded the 3-byte limit while streaming',
  )
  assertEquals((error as ApplicationError).code, 'UTILS_NETWORK_BODY_TOO_LARGE')
  assertEquals((error as ApplicationError).meta, { maxBytes: 3 })
  assertEquals(cancelled, true)
})

Deno.test('readBoundedStream: rejects one oversized chunk, no further buffering', async () => {
  const stream = streamOf([new Uint8Array(20)])
  await assertRejects(
    () => readBoundedStream(stream, 10),
    ApplicationError,
  )
})

Deno.test('readBoundedStream: caps against real bytes, ignoring Content-Length', async () => {
  // Simulates a chunked-transfer-encoding body: no Content-Length was ever checked here, only
  // the real bytes read from the stream matter.
  const stream = streamOf([new Uint8Array(5), new Uint8Array(5), new Uint8Array(5)])
  await assertRejects(() => readBoundedStream(stream, 10), ApplicationError)
})
