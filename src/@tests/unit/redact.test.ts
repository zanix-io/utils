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

Deno.test('redactSensitiveData redacts otpCode/otpTarget, leaves generic code/target alone', () => {
  // Regression guard for the observability audit's P0 finding: `@zanix/auth`'s OTP flow used to
  // put the real code + delivery destination under the generic keys `code`/`target`, which this
  // pattern deliberately does NOT match (both names are used ecosystem-wide for non-sensitive
  // things — an error's own `code`, a route's `target` — see `redact.ts`'s own doc). The fix
  // renamed those two fields to `otpCode`/`otpTarget`; this locks in both halves of that fix: the
  // namespaced names ARE redacted, and the generic names are proven to still NOT be, so a future
  // change can't silently widen the pattern into a false-positive flood.
  const input = {
    otpCode: '482913',
    otpTarget: 'user@example.com',
    'OTP-Code': '482913',
    code: 'MONGODB_CONNECTION_FAILED',
    target: 'some/route/path',
  }

  assertEquals(redactSensitiveData(input), {
    otpCode: '[REDACTED]',
    otpTarget: '[REDACTED]',
    'OTP-Code': '[REDACTED]',
    code: 'MONGODB_CONNECTION_FAILED',
    target: 'some/route/path',
  })
})

Deno.test('redactSensitiveData redacts the PII/PCI batch: password/card/ssn/cvv/pin/bank', () => {
  // Regression guard for the observability audit's Open Question, now resolved: expand the
  // default pattern beyond classic HTTP-credential naming to cover a signup/checkout form's own
  // field names, without turning generic words into false-positive floods.
  const input = {
    newPassword: 'hunter3',
    confirmPassword: 'hunter3',
    oldPassword: 'hunter2',
    creditCardNumber: '4111111111111111',
    CardNumber: '4111111111111111',
    ssn: '123-45-6789',
    cvv: '123',
    cvc: '123',
    pinCode: '4242',
    securityPin: '4242',
    bankAccountNumber: '000123456789',
    // `pin` alone is deliberately NOT redacted — too generic (a pinned version, a UI "pin" action,
    // a GPIO pin) to blanket-match safely, unlike `ssn`/`cvv` which have no non-sensitive meaning.
    pin: 'kept as-is (bare, deliberately unmatched)',
    pinnedVersion: 'kept as-is',
  }

  assertEquals(redactSensitiveData(input), {
    newPassword: '[REDACTED]',
    confirmPassword: '[REDACTED]',
    oldPassword: '[REDACTED]',
    creditCardNumber: '[REDACTED]',
    CardNumber: '[REDACTED]',
    ssn: '[REDACTED]',
    cvv: '[REDACTED]',
    cvc: '[REDACTED]',
    pinCode: '[REDACTED]',
    securityPin: '[REDACTED]',
    bankAccountNumber: '[REDACTED]',
    pin: 'kept as-is (bare, deliberately unmatched)',
    pinnedVersion: 'kept as-is',
  })
})

Deno.test('redactSensitiveData redacts captcha-token variants like x-znx-app-token', () => {
  // Regression guard for @zanix/auth's captchaGuard: X-Znx-Captcha-Token carries a bearer-shaped
  // provider response token, so it needs the same default coverage `(?:x-znx-app-)?token` already
  // gives X-Znx-App-Token — not left to each consumer's own `RedactOptions.extend`.
  const input = {
    'X-Znx-Captcha-Token': 'response-token-value',
    captchaToken: 'response-token-value',
    'captcha-token': 'response-token-value',
    safe: 'kept as-is',
  }

  assertEquals(redactSensitiveData(input), {
    'X-Znx-Captcha-Token': '[REDACTED]',
    captchaToken: '[REDACTED]',
    'captcha-token': '[REDACTED]',
    safe: 'kept as-is',
  })
})

Deno.test(
  'redactSensitiveData redacts any X-Znx--prefixed key containing "csrf", by containment not ' +
    'exact match — the one entry in this pattern matched this way, deliberately',
  () => {
    // Regression guard: `@zanix/space`'s `csrfGuard` exposes its own cookie's name as a
    // customizable `cookieName` option (default `X-Znx-Csrf`) — an exact-name entry here would
    // only ever catch the untouched default and silently miss a customized one. This is safe only
    // because `assertZnxCookieName`'s `mustContain` check (`src/utils/cookies.ts`) guarantees any
    // name `csrfGuard` actually accepts still contains "csrf" somewhere.
    const input = {
      'X-Znx-Csrf': 'token-value',
      'X-Znx-My-Csrf': 'token-value',
      'X-Znx-Csrf-Token': 'token-value',
      'x-znx-csrf': 'token-value',
      // Not X-Znx--prefixed — a bare `csrf`-named field elsewhere in the app is NOT this guard's
      // cookie, and blanket-matching any "csrf" substring regardless of prefix would be exactly
      // the false-positive flood this pattern's "match by key name, not content" design avoids.
      csrf: 'kept as-is',
      csrfToken: 'kept as-is',
      'X-Znx-Lang': 'kept as-is',
    }

    assertEquals(redactSensitiveData(input), {
      'X-Znx-Csrf': '[REDACTED]',
      'X-Znx-My-Csrf': '[REDACTED]',
      'X-Znx-Csrf-Token': '[REDACTED]',
      'x-znx-csrf': '[REDACTED]',
      csrf: 'kept as-is',
      csrfToken: 'kept as-is',
      'X-Znx-Lang': 'kept as-is',
    })
  },
)

Deno.test(
  'redactSensitiveData redacts `_csrf`, the same token carried over a third, ' +
    'non-customizable channel',
  () => {
    // Regression guard: `csrfGuard` also accepts the CSRF token via a plain HTML `<form>`'s own
    // `_csrf` field, alongside the `X-Znx-Csrf` cookie and `X-Znx-Csrf-Token` header. Unlike those
    // two, `_csrf` isn't a configurable option on `csrfGuard` — there's nothing to customize away
    // from it — so it's matched by exact equality, not containment.
    const input = {
      _csrf: 'token-value',
      // Doesn't match — exact equality only, same as every other non-containment entry.
      csrfField: 'kept as-is',
    }

    assertEquals(redactSensitiveData(input), {
      _csrf: '[REDACTED]',
      csrfField: 'kept as-is',
    })
  },
)

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

/**
 * Regression coverage for a confirmed gap: `RedactOptions` used to be replace-only — a caller
 * wanting to redact one more key name (e.g. a compound name the built-in pattern's exact match
 * misses, like `dbPassword`) had to reconstruct the entire built-in pattern by hand just to add it.
 * `extend` composes instead of replacing.
 */
Deno.test('createRedactor: extend adds a string key name on top of the built-in pattern', () => {
  const redact = createRedactor({ extend: ['dbPassword'] })
  assertEquals(redact({ token: 'secret', dbPassword: 'hunter2', safe: 'kept' }), {
    token: '[REDACTED]',
    dbPassword: '[REDACTED]',
    safe: 'kept',
  })
})

Deno.test('createRedactor: extend matches a string key case-insensitively, exactly', () => {
  const redact = createRedactor({ extend: ['dbPassword'] })
  assertEquals(redact({ DBPASSWORD: 'x', dbPasswordExtra: 'y' }), {
    DBPASSWORD: '[REDACTED]',
    dbPasswordExtra: 'y', // not an exact match — extend is exact-name, not substring
  })
})

Deno.test('createRedactor: extend accepts a RegExp for a rule broader than one name', () => {
  const redact = createRedactor({ extend: [/secret$/i] })
  assertEquals(redact({ apiSecretKey: 'kept', awsSecretAccessKey: 'kept', mySecret: 'hidden' }), {
    apiSecretKey: 'kept', // doesn't end in "secret"
    awsSecretAccessKey: 'kept', // doesn't end in "secret" either
    mySecret: '[REDACTED]',
  })
})

Deno.test('createRedactor: extend composes with a custom pattern too, not just built-in', () => {
  const redact = createRedactor({ pattern: /^x-internal-.*$/i, extend: ['dbPassword'] })
  assertEquals(redact({ token: 'kept', 'x-internal-id': 'hidden', dbPassword: 'hidden' }), {
    token: 'kept', // the built-in pattern no longer applies once `pattern` is given
    'x-internal-id': '[REDACTED]',
    dbPassword: '[REDACTED]',
  })
})

Deno.test('createRedactor: an empty extend list behaves identically to omitting it', () => {
  const redact = createRedactor({ extend: [] })
  assertEquals(redact({ token: 'secret', safe: 'kept' }), {
    token: '[REDACTED]',
    safe: 'kept',
  })
})

Deno.test('createRedactor: extend never narrows what the base pattern already redacts', () => {
  const redact = createRedactor({ extend: [/never-matches-anything/] })
  assertEquals(redact({ token: 'secret' }), { token: '[REDACTED]' })
})

Deno.test('setDefaultRedactOptions: a global extend applies to every default-redact call', () => {
  try {
    assertEquals(createRedactor()({ dbPassword: 'x' }), { dbPassword: 'x' })

    setDefaultRedactOptions({ extend: ['dbPassword'] })

    assertEquals(createRedactor()({ dbPassword: 'x', token: 'y' }), {
      dbPassword: '[REDACTED]',
      token: '[REDACTED]', // the built-in pattern still applies too — extend only adds
    })
  } finally {
    setDefaultRedactOptions(true)
  }
})

Deno.test('createRedactor: a local extend layers atop a global extend, not instead', () => {
  try {
    setDefaultRedactOptions({ extend: ['dbPassword'] })

    const redact = createRedactor({ extend: ['awsSecretAccessKey'] })
    assertEquals(
      redact({ dbPassword: 'x', awsSecretAccessKey: 'y', token: 'z', safe: 'kept' }),
      {
        dbPassword: '[REDACTED]', // from the global extend
        awsSecretAccessKey: '[REDACTED]', // from this call's own extend
        token: '[REDACTED]', // the built-in pattern
        safe: 'kept',
      },
    )
  } finally {
    setDefaultRedactOptions(true)
  }
})

Deno.test('buildKeyMatcher: escapes a string entry, matching it literally not as a regex', () => {
  const redact = createRedactor({ extend: ['a.b'] })
  assertEquals(redact({ 'a.b': 'x', axb: 'kept' }), { 'a.b': '[REDACTED]', axb: 'kept' })
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
