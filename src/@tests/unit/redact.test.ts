import { assert, assertEquals, assertNotStrictEquals, assertStrictEquals } from '@std/assert'
import { HttpError } from 'modules/errors/main.ts'
import { serializeError } from 'modules/errors/serialize.ts'
import {
  createRedactor,
  DEFAULT_REDACT_PATTERN,
  redactSensitiveData,
  setDefaultRedactOptions,
} from 'modules/errors/redact.ts'

Deno.test('redactSensitiveData redacts credential-shaped keys, case-insensitively', () => {
  const input = {
    'X-Znx-App-Token': '123',
    'X-Znx-authorization': '123',
    Authorization: 'Bearer secret-token',
    password: 'hunter2',
    apiKey: 'abc123',
    ACCESS_TOKEN: 'xyz',
    safe: 'kept as-is',
  }

  assertEquals(redactSensitiveData(input), {
    'X-Znx-App-Token': '[REDACTED]',
    'X-Znx-authorization': '[REDACTED]',
    Authorization: '[REDACTED]',
    password: '[REDACTED]',
    apiKey: '[REDACTED]',
    ACCESS_TOKEN: '[REDACTED]',
    safe: 'kept as-is',
  })
})

Deno.test('redactSensitiveData recurses into nested objects and arrays', () => {
  const input = {
    user: { name: 'Ada', credentials: { token: 'secret' } },
    sessions: [{ sessionId: 'abc' }, { sessionId: 'def' }],
  }

  assertEquals(redactSensitiveData(input), {
    user: { name: 'Ada', credentials: '[REDACTED]' },
    sessions: [{ sessionId: '[REDACTED]' }, { sessionId: '[REDACTED]' }],
  })
})

Deno.test('redactSensitiveData never mutates its input', () => {
  const input = { token: 'secret', nested: { password: 'x' } }
  const result = redactSensitiveData(input)

  assertEquals(input, { token: 'secret', nested: { password: 'x' } })
  assertNotStrictEquals(result, input)
})

Deno.test('redactSensitiveData converts a Headers instance, redacting sensitive entries', () => {
  const headers = new Headers({
    Authorization: 'Bearer secret',
    'x-request-id': 'abc',
  })

  assertEquals(redactSensitiveData(headers), {
    authorization: '[REDACTED]',
    'x-request-id': 'abc',
  })
})

Deno.test('redactSensitiveData converts a Request instance, redacting nested headers', () => {
  const request = new Request('https://example.com/path', {
    headers: { Authorization: 'Bearer secret' },
  })

  assertEquals(redactSensitiveData(request), {
    method: 'GET',
    url: 'https://example.com/path',
    headers: { authorization: '[REDACTED]' },
  })
})

Deno.test('redactSensitiveData redacts a Headers/Request value nested arbitrarily deep', () => {
  const headers = new Headers({ Authorization: 'Bearer secret' })

  assertEquals(redactSensitiveData({ meta: { headers } }), {
    meta: { headers: { authorization: '[REDACTED]' } },
  })
})

Deno.test('redactSensitiveData replaces circular references instead of recursing forever', () => {
  const input: Record<string, unknown> = { name: 'root' }
  input.self = input

  assertEquals(redactSensitiveData(input), {
    name: 'root',
    self: '[CIRCULAR]',
  })
})

Deno.test('redactSensitiveData preserves a native Error message/stack/instanceof', () => {
  const error = new Error('boom')
  const result = redactSensitiveData(error) as Error

  assert(result instanceof Error)
  assertEquals(result.message, 'boom')
  assertEquals(result.stack, error.stack)
  assertNotStrictEquals(result, error)
})

Deno.test('redactSensitiveData redacts sensitive fields on an Error, keeping message/stack', () => {
  const error = new HttpError('BAD_GATEWAY', {
    meta: { token: 'secret', safe: 'kept' },
  })
  const result = redactSensitiveData(error) as HttpError

  assert(result instanceof HttpError)
  assertEquals(result.message, error.message)
  assertEquals(result.stack, error.stack)
  assertEquals(result.meta, { token: '[REDACTED]', safe: 'kept' })
})

Deno.test('redactSensitiveData redacts a cause chain on an Error', () => {
  const cause = new HttpError('BAD_GATEWAY', { meta: { token: 'secret' } })
  const error = new Error('outer', { cause })
  const result = redactSensitiveData(error) as Error & { cause: HttpError }

  assertEquals(result.cause.meta, { token: '[REDACTED]' })
})

Deno.test('redactSensitiveData leaves primitives untouched', () => {
  assertStrictEquals(redactSensitiveData('plain string'), 'plain string')
  assertStrictEquals(redactSensitiveData(42), 42)
  assertStrictEquals(redactSensitiveData(null), null)
  assertStrictEquals(redactSensitiveData(undefined), undefined)
})

Deno.test('createRedactor defaults to true — redacts with the built-in pattern', () => {
  const redact = createRedactor()
  assertEquals(redact({ token: 'secret', safe: 'kept' }), {
    token: '[REDACTED]',
    safe: 'kept',
  })
})

Deno.test('createRedactor: false returns the identity function', () => {
  const redact = createRedactor(false)
  const input = { token: 'secret' }
  assertStrictEquals(redact(input), input)
})

Deno.test('createRedactor: a custom pattern replaces the built-in one entirely', () => {
  const redact = createRedactor({ pattern: /^x-internal-.*$/i })
  assertEquals(redact({ token: 'kept', 'x-internal-id': 'hidden' }), {
    token: 'kept',
    'x-internal-id': '[REDACTED]',
  })
})

Deno.test('createRedactor: {} with no pattern falls back to the built-in one', () => {
  const redact = createRedactor({})
  assertEquals(redact({ token: 'secret' }), { token: '[REDACTED]' })
})

Deno.test(
  'setDefaultRedactOptions: a custom pattern changes what every no-explicit-pattern call ' +
    'falls back to',
  () => {
    try {
      // Sanity check first: the built-in pattern doesn't know this key.
      assertEquals(redactSensitiveData({ 'my-secret': 'x' }), {
        'my-secret': 'x',
      })
      assertEquals(createRedactor()({ 'my-secret': 'x' }), {
        'my-secret': 'x',
      })

      setDefaultRedactOptions({ pattern: /^my-secret$/i })

      // Neither call passes its own pattern — both now pick up the new default.
      assertEquals(redactSensitiveData({ 'my-secret': 'x' }), {
        'my-secret': '[REDACTED]',
      })
      assertEquals(createRedactor()({ 'my-secret': 'x' }), {
        'my-secret': '[REDACTED]',
      })
    } finally {
      setDefaultRedactOptions(true)
    }
  },
)

Deno.test(
  'setDefaultRedactOptions: false disables redaction for every no-explicit-redact call, ' +
    'not just a pattern change',
  () => {
    try {
      // Sanity check first: with no global override, an omitted `redact` still redacts, using
      // the built-in pattern — this is `serializeError`'s exact call shape with no `redact` of
      // its own (e.g. `@zanix/server`'s `getExtendedErrorResponse`).
      assertEquals(createRedactor()({ token: 'x' }), { token: '[REDACTED]' })

      setDefaultRedactOptions(false)

      // The real bug this guards against: `redact: false` on a `Logger` disabled its own
      // console/storage redaction, but any OTHER caller with no explicit `redact` of its own
      // (like `serializeError`'s default) kept applying the built-in pattern regardless, since
      // `createRedactor`'s own default was hardcoded to `true` instead of reading this global.
      assertEquals(createRedactor()({ token: 'x' }), { token: 'x' })
    } finally {
      setDefaultRedactOptions(true)
    }
  },
)

Deno.test('setDefaultRedactOptions: an explicit pattern at the call site still wins', () => {
  try {
    setDefaultRedactOptions({ pattern: /^my-secret$/i })

    // The built-in pattern, passed explicitly, is still respected over the new default.
    assertEquals(
      redactSensitiveData(
        { 'my-secret': 'x', token: 'y' },
        DEFAULT_REDACT_PATTERN,
      ),
      { 'my-secret': 'x', token: '[REDACTED]' },
    )
  } finally {
    setDefaultRedactOptions(true)
  }
})

Deno.test('setDefaultRedactOptions: an explicit redact:false at the call site still wins', () => {
  try {
    setDefaultRedactOptions({ pattern: /^my-secret$/i })

    // A caller that explicitly opts out is still respected, even with a global override active.
    assertStrictEquals(
      createRedactor(false)('kept-as-is' as never),
      'kept-as-is',
    )
  } finally {
    setDefaultRedactOptions(true)
  }
})

Deno.test(
  "setDefaultRedactOptions: serializeError's own default (no `redact` option) picks it up too — " +
    'the exact gap that let a custom Logger pattern/false protect logs but not error responses',
  () => {
    try {
      const error = new HttpError('BAD_GATEWAY', {
        meta: { 'my-secret': 'x' },
      })

      assertEquals((serializeError(error) as HttpError).meta, {
        'my-secret': 'x',
      })

      setDefaultRedactOptions({ pattern: /^my-secret$/i })
      assertEquals((serializeError(error) as HttpError).meta, {
        'my-secret': '[REDACTED]',
      })

      setDefaultRedactOptions(false)
      assertEquals((serializeError(error) as HttpError).meta, {
        'my-secret': 'x',
      })
    } finally {
      setDefaultRedactOptions(true)
    }
  },
)
