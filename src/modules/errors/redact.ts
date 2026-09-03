import type { RedactOptions } from 'typings/errors.ts'

/**
 * Key names treated as credentials, case-insensitive — the standard set most logging libraries
 * (pino, winston, etc.) redact by default. Deliberately scoped to *structured* fields, matched by
 * key name: this never scans string *content* for something that looks like a token (too many
 * false positives/negatives to be worth it) — only a field explicitly named like a credential.
 * Used whenever a caller doesn't supply its own pattern via {@linkcode RedactOptions}.
 *
 * `otp[-_]?code`/`otp[-_]?target` are deliberately namespaced under `otp` rather than matching the
 * bare `code`/`target` — those two generic names are used ecosystem-wide for non-sensitive things
 * (an error's own `code`, a route's `target`), so redacting them outright would be a false-positive
 * flood. A one-time-password's actual value and its delivery destination (phone/email) are the
 * specific things worth catching here — a consumer that names its OTP fields this way (as
 * `@zanix/auth`'s own `otp` flow does) gets them redacted automatically; the generic `code`/`target`
 * used everywhere else is untouched.
 *
 * The PII/PCI batch (`newPassword`/`confirmPassword`, `creditCard(Number)`/`cardNumber`, `ssn`,
 * `cvv`/`cvc`, `pinCode`, `bankAccount(Number)`) closes the observability audit's own named gap:
 * the original set only covered classic HTTP-credential naming, not a signup/checkout form's own
 * field names. `pin` alone is deliberately NOT matched bare — unlike `ssn`/`cvv`, which have no
 * common non-sensitive meaning, a bare `pin` collides with ordinary non-sensitive usage (a pinned
 * version, a UI "pin this item" action, a GPIO pin) too often to blanket-redact; `pinCode`/
 * `securityPin` are the namespaced forms worth catching automatically, same reasoning as `otp`
 * above — a consumer with a genuinely bare `pin` field should redact it via `RedactOptions.extend`
 * instead of leaning on the default here.
 *
 * `(?:x-znx-)?captcha[-_]?token` covers `@zanix/auth`'s `captchaGuard` request header
 * (`X-Znx-Captcha-Token`) the same way `(?:x-znx-app-)?token` already covers `X-Znx-App-Token` —
 * a bearer-shaped credential value, worth catching by default rather than requiring every consumer
 * to configure `RedactOptions.extend` for a framework-owned header.
 *
 * `x-znx-[\w-]*csrf[\w-]*` is the one entry here matched by CONTAINMENT rather than exact equality
 * — deliberately, not an oversight: `@zanix/space`'s `csrfGuard` exposes its own cookie's name as a
 * customizable `cookieName` option (default `X-Znx-Csrf`), so an exact-name entry would only catch
 * the untouched default and silently miss any customized name — the same class of silent gap this
 * whole pattern exists to close. Safe specifically because `assertZnxCookieName`'s `mustContain`
 * check (`@zanix/utils`'s own `src/utils/cookies.ts`) is what `csrfGuard` calls to validate a
 * customized name, and it REQUIRES `Csrf` to appear somewhere in it — so this containment match is
 * guaranteed to catch any name that constraint allows, by construction, not by coincidence. Every
 * other entry here stays exact-match: this shape only works because a naming rule elsewhere
 * guarantees it, and that guarantee doesn't exist for any other credential-shaped field.
 *
 * `_csrf` carries the exact same token as the entries above, over a third channel `csrfGuard`
 * accepts it on — a normal HTML `<form>` submission's own `_csrf` field, alongside the
 * `X-Znx-Csrf` cookie and the `X-Znx-Csrf-Token` header a fetch/XHR-based action sends instead.
 * Matched by exact equality, not containment: unlike `cookieName`/`headerName`, this field's name
 * isn't a configurable option on `csrfGuard` — there's nothing a consumer could customize away
 * from it.
 *
 * `x-znx-oauth-state` covers `@zanix/auth`'s `oauthStateIssueGuard`/`oauthStateVerifyGuard` cookie
 * — a short-lived, randomly generated anti-CSRF value carried through an OAuth2 authorization
 * redirect and its callback, exactly the kind of value this pattern already redacts for every other
 * session/token cookie. Matched by exact equality, not containment: unlike `csrfGuard`'s own cookie
 * name, this one is a fixed constant with no customizable option, so there's no equivalent risk of
 * a renamed cookie silently escaping coverage.
 */
const SENSITIVE_KEY_PATTERN =
  /^((?:x-znx-)?authorization|cookie|set-cookie|password|passwd|pwd|(?:new|confirm|old|current)[-_]?password|(?:x-znx-app-)?token|(?:x-znx-)?captcha[-_]?token|x-znx-oauth-state|x-znx-[\w-]*csrf[\w-]*|_csrf|secret|api[-_]?key|refresh[-_]?token|access[-_]?token|client[-_]?secret|private[-_]?key|session(?:[-_]?id)?|credentials?|otp[-_]?code|otp[-_]?target|credit[-_]?card(?:[-_]?number)?|card[-_]?number|ssn|cvv|cvc|pin[-_]?code|security[-_]?pin|bank[-_]?account(?:[-_]?number)?)$/i

/**
 * The built-in credential-key pattern — the effective pattern whenever nothing has overridden the
 * default via {@linkcode setDefaultRedactOptions} (or that override is `true`/has no `pattern` of
 * its own). Exported so a caller can compose against it directly, or restore it in a test that
 * needs to clean up after itself, since the override below is process-wide, mutable state — though
 * `RedactOptions.extend` is the more convenient way to add a key name on top of it without
 * reconstructing it by hand.
 */
export const DEFAULT_REDACT_PATTERN: RegExp = SENSITIVE_KEY_PATTERN

let defaultOptions: RedactOptions = true

/**
 * Resolves the matcher to actually use when nothing calls `redactSensitiveData` with an explicit
 * one of its own — reads whatever {@linkcode setDefaultRedactOptions} last set, already composed
 * with its own `extend` (if any) via {@linkcode buildKeyMatcher}. `redactSensitiveData` itself has
 * no "disabled" concept (that's `createRedactor`'s `false` branch, below); called directly, it
 * always redacts *something*, so a global default of `false` still resolves to the built-in
 * pattern here rather than to no pattern at all.
 */
function resolveDefaultPattern(): KeyMatcher {
  const base = typeof defaultOptions === 'object' && defaultOptions.pattern
    ? defaultOptions.pattern
    : SENSITIVE_KEY_PATTERN
  const extend = typeof defaultOptions === 'object' ? defaultOptions.extend : undefined
  return buildKeyMatcher(base, extend)
}

/** Structural subset of `RegExp` that `redactSensitiveData` actually needs — a real `RegExp`
 * satisfies this on its own; {@linkcode buildKeyMatcher} instead returns a plain object when
 * `RedactOptions.extend` is in play, since an `extend` list isn't itself expressible as a single
 * `RegExp` without fragile source-string surgery on whatever `pattern` (built-in or custom) it's
 * composing with. */
export type KeyMatcher = { test(key: string): boolean }

/** Escapes every regex metacharacter in `value` so it can be spliced into a pattern and matched
 * literally — used for a plain-string `RedactOptions.extend` entry, matched as an exact key name,
 * never interpreted as a regex fragment. */
function escapeRegExpLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Combines a base key-name pattern with `RedactOptions.extend`'s own entries into one matcher — a
 * key redacts if it matches *either* side, so `extend` only ever adds coverage, never narrows what
 * the base pattern already catches. Returns `base` itself, unchanged, when `extend` is empty/absent
 * (the common case), so the no-`extend` path costs nothing beyond the base pattern's own `.test()`.
 *
 * A plain string in `extend` is escaped and matched as an exact key name, case-insensitively — the
 * same semantics as every built-in entry in `SENSITIVE_KEY_PATTERN`. A `RegExp` is tested against
 * the key as-is, for a rule broader than one literal name (e.g. a compound-name suffix rule like
 * `/secret$/i`).
 */
export function buildKeyMatcher(base: KeyMatcher, extend?: (string | RegExp)[]): KeyMatcher {
  if (!extend?.length) return base

  const extraPatterns = extend.map((entry) =>
    typeof entry === 'string' ? new RegExp(`^${escapeRegExpLiteral(entry)}$`, 'i') : entry
  )

  return {
    test: (key: string) => base.test(key) || extraPatterns.some((pattern) => pattern.test(key)),
  }
}

/**
 * Overrides the {@linkcode RedactOptions} every `redactSensitiveData`/`serializeError`/
 * `createRedactor` call falls back to when it isn't given its own explicit `redact`/`pattern` —
 * same shape and meaning as `Logger`'s own `redact` option: `false` disables redaction entirely,
 * `{ pattern }` replaces the built-in key-name pattern, `{ extend }` adds to whichever pattern
 * applies instead of replacing it, `true` restores built-in behavior.
 *
 * This is the single place an app-wide redaction preference (e.g. set once from `Zanix.setup()`)
 * needs to be registered to apply everywhere sensitive data might get redacted — not just a
 * `Logger`'s own console/storage output, but just as importantly `@zanix/server`'s client-facing
 * error responses (`getExtendedErrorResponse`/`httpErrorResponse`), which call `serializeError`
 * with no `redact` option of their own and would otherwise only ever apply built-in, default
 * behavior — confirmed as a real gap, not hypothetical: a custom `Logger({ redact })` alone
 * (whether a custom pattern or `false`) protected/disabled logs but never touched the error
 * response body, since the two never shared any configuration before this existed.
 *
 * Only affects callers that don't pass their own `pattern`/`redact` explicitly — an explicit one
 * always wins, at any call site, same as before.
 *
 * @param options - The new default. Pass `true` to restore built-in behavior.
 */
export function setDefaultRedactOptions(options: RedactOptions): void {
  defaultOptions = options
}

const REDACTED = '[REDACTED]'
const CIRCULAR = '[CIRCULAR]'

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {}
  for (const [key, value] of headers) record[key] = value
  return record
}

/**
 * Recursively redacts any value keyed like a credential before a log entry reaches either the
 * console or a storage backend (file, or any custom `storage.save` — Elasticsearch included, since
 * both read from the exact same formatted output).
 *
 * `Headers`/`Request` values get special handling, not just left to fall through to a generic
 * object walk: both hide their real data behind non-enumerable internals invisible to
 * `Object.entries`/`JSON.stringify`, but Deno's own console inspector has dedicated formatting for
 * them that reads that data anyway — verified directly, not assumed (a `Headers` instance nested
 * inside a plain object still prints every header, `Authorization` included, under
 * `console.error`, even though the exact same value serializes to `{}` under `JSON.stringify`).
 * Redacting only by key name would never catch that: there's no key to match against a raw
 * `Headers`/`Request` value, only once it's converted into named fields.
 *
 * `Error` (and subclasses like `HttpError`/`ApplicationError`) also get special handling instead of
 * falling through to the generic object walk: `name`/`message`/`stack` live on non-enumerable own
 * properties, so a naive `Object.entries` walk would silently collapse a passed-in error down to
 * just its enumerable fields (e.g. `meta`), losing the message/stack a caller of `logger.warn('X
 * failed', err)` actually wants to see. This clones the error (same prototype, so `instanceof`
 * checks downstream — e.g. `serializeError`'s own branching — keep working) preserving every own
 * property descriptor, then redacts only the enumerable ones (`meta` and friends) plus a `cause`
 * chain, in place.
 *
 * Never mutates its input — always returns a new value. Circular references are replaced with
 * `'[CIRCULAR]'` instead of recursing forever.
 *
 * @param value - The value to redact.
 * @param pattern - Case-insensitive key-name matcher a field must satisfy to be redacted — a real
 * `RegExp` works directly (it already has a `.test(key)` method); {@linkcode buildKeyMatcher}
 * produces the plain-object form when a `RedactOptions.extend` list is layered on top of one.
 * Defaults to whatever {@linkcode setDefaultRedactOptions} last set as the app-wide pattern (the
 * built-in credential-key pattern, until something overrides it) — pass a custom one to match this
 * codebase's own conventions instead for just this one call (see {@linkcode RedactOptions}, e.g.
 * `Logger`'s own `redact` option).
 */
export function redactSensitiveData(
  value: unknown,
  pattern: KeyMatcher = resolveDefaultPattern(),
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (value instanceof Headers) {
    return redactSensitiveData(headersToRecord(value), pattern, seen)
  }

  if (value instanceof Request) {
    return redactSensitiveData(
      { method: value.method, url: value.url, headers: value.headers },
      pattern,
      seen,
    )
  }

  if (value instanceof Error) {
    if (seen.has(value)) return CIRCULAR
    seen.add(value)

    // `message`/`stack` are read through normal property access (not copied via
    // `getOwnPropertyDescriptors`) because V8 backs `stack` with a lazy accessor bound to the
    // original error's internal state — copying that descriptor onto a clone silently produces
    // `undefined` instead of the formatted trace, verified directly, not assumed.
    const clone = Object.create(Object.getPrototypeOf(value))
    Object.defineProperty(clone, 'message', {
      value: value.message,
      enumerable: false,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(clone, 'stack', {
      value: value.stack,
      enumerable: false,
      configurable: true,
      writable: true,
    })

    for (const key of Object.keys(value)) {
      clone[key] = pattern.test(key) ? REDACTED : redactSensitiveData(
        (value as unknown as Record<string, unknown>)[key],
        pattern,
        seen,
      )
    }
    if ('cause' in value && value.cause !== undefined) {
      Object.defineProperty(clone, 'cause', {
        value: redactSensitiveData(value.cause, pattern, seen),
        enumerable: false,
        configurable: true,
        writable: true,
      })
    }
    return clone
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitiveData(entry, pattern, seen))
  }

  if (value === null || typeof value !== 'object') return value

  if (seen.has(value)) return CIRCULAR
  seen.add(value)

  const result: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    result[key] = pattern.test(key) ? REDACTED : redactSensitiveData(entry, pattern, seen)
  }
  return result
}

/**
 * Builds a single-argument redacting function from a {@linkcode RedactOptions} value — the shape
 * `Logger`'s own `redact` option (and anything else that wants the same on/off/custom-pattern
 * knob) is built around. `false` yields the identity function (redaction fully disabled); `true`
 * yields whatever pattern {@linkcode setDefaultRedactOptions} last set (the built-in one unless
 * something overrode it); `{ pattern }` yields a custom one for just this instance; `{ extend }`
 * (with or without `pattern`) layers those extra entries on top of whichever pattern applies —
 * built-in, the app-wide default, or this call's own `pattern` — rather than requiring a caller to
 * reconstruct it from scratch just to add one more sensitive key name.
 *
 * Omitting `options` entirely (as `serializeError`'s own internal call does when its own caller
 * passes no `redact`) defers to {@linkcode setDefaultRedactOptions}'s *entire* current default —
 * including `false` — not just its pattern. This is what makes a global `redact: false` actually
 * disable redaction in a caller (like `@zanix/server`'s error-response building) that never passes
 * its own `redact` at all, not just callers that ask for the built-in pattern.
 *
 * @param options - See {@linkcode RedactOptions}. Defaults to the current app-wide default
 * (itself `true` — redaction on, built-in pattern — until something overrides it) — safety-first,
 * since silently doing nothing would be the wrong default for a knob whose entire purpose is
 * preventing a credential leak.
 */
export function createRedactor(
  options: RedactOptions = defaultOptions,
): (value: unknown) => unknown {
  if (options === false) return (value) => value
  if (options === true) {
    const pattern = resolveDefaultPattern()
    return (value: unknown) => redactSensitiveData(value, pattern)
  }
  const base = options.pattern ?? resolveDefaultPattern()
  const pattern = buildKeyMatcher(base, options.extend)
  return (value: unknown) => redactSensitiveData(value, pattern)
}
