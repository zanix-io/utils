import type { RedactOptions } from 'typings/errors.ts'

/**
 * Key names treated as credentials, case-insensitive — the standard set most logging libraries
 * (pino, winston, etc.) redact by default. Deliberately scoped to *structured* fields, matched by
 * key name: this never scans string *content* for something that looks like a token (too many
 * false positives/negatives to be worth it) — only a field explicitly named like a credential.
 * Used whenever a caller doesn't supply its own pattern via {@linkcode RedactOptions}.
 */
const SENSITIVE_KEY_PATTERN =
  /^((?:x-znx-)?authorization|cookie|set-cookie|password|passwd|pwd|(?:x-znx-app-)?token|secret|api[-_]?key|refresh[-_]?token|access[-_]?token|client[-_]?secret|private[-_]?key|session(?:[-_]?id)?|credentials?)$/i

/**
 * The built-in credential-key pattern — the effective pattern whenever nothing has overridden the
 * default via {@linkcode setDefaultRedactOptions} (or that override is `true`/has no `pattern` of
 * its own). Exported so a caller can compose against it (e.g. extend rather than replace it) or
 * restore it in a test that needs to clean up after itself, since the override below is
 * process-wide, mutable state.
 */
export const DEFAULT_REDACT_PATTERN: RegExp = SENSITIVE_KEY_PATTERN

let defaultOptions: RedactOptions = true

/**
 * Resolves the pattern to actually use when nothing calls `redactSensitiveData` with an explicit
 * one of its own — reads whatever {@linkcode setDefaultRedactOptions} last set. `redactSensitiveData`
 * itself has no "disabled" concept (that's `createRedactor`'s `false` branch, below); called
 * directly, it always redacts *something*, so a global default of `false` still resolves to the
 * built-in pattern here rather than to no pattern at all.
 */
function resolveDefaultPattern(): RegExp {
  return typeof defaultOptions === 'object' && defaultOptions.pattern
    ? defaultOptions.pattern
    : SENSITIVE_KEY_PATTERN
}

/**
 * Overrides the {@linkcode RedactOptions} every `redactSensitiveData`/`serializeError`/
 * `createRedactor` call falls back to when it isn't given its own explicit `redact`/`pattern` —
 * same shape and meaning as `Logger`'s own `redact` option: `false` disables redaction entirely,
 * `{ pattern }` replaces the built-in key-name pattern, `true` restores built-in behavior.
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
 * @param pattern - Case-insensitive key-name pattern a field must match to be redacted. Defaults to
 * whatever {@linkcode setDefaultRedactOptions} last set as the app-wide pattern (the built-in
 * credential-key pattern, until something overrides it) — pass a custom one to match this
 * codebase's own conventions instead for just this one call (see {@linkcode RedactOptions}, e.g.
 * `Logger`'s own `redact` option).
 */
export function redactSensitiveData(
  value: unknown,
  pattern: RegExp = resolveDefaultPattern(),
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
 * something overrode it); `{ pattern }` yields a custom one for just this instance.
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
  const pattern = (options === true || !options.pattern) ? resolveDefaultPattern() : options.pattern
  return (value: unknown) => redactSensitiveData(value, pattern)
}
