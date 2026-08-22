# Errors

The `/errors` subpath ships a small hierarchy of custom error classes, a map of
HTTP status codes, and helpers to serialize errors into plain, loggable objects.
The hierarchy is: `HttpError extends Deno.errors.Http`;
`ApplicationError extends Error`; `PermissionDenied extends ApplicationError`;
and `InternalError extends ApplicationError`. All four classes share the same
base behavior — a generated `id`, an optional `code` and `meta`, an optional
`cause`, and an opt-in `shouldLog` flag that logs the error through
`@zanix/utils/logger` as soon as it's constructed.

```ts
import {
  ApplicationError,
  HttpError,
  httpStates,
  InternalError,
  PermissionDenied,
  serializeError,
  serializeMultipleErrors,
} from 'jsr:@zanix/utils@[version]/errors'
```

## Choosing a class

Every error crossing a package boundary (thrown to a caller, returned in an
HTTP response, or handed to `logger.error`) should be one of these four — never
a plain `Error`/`Deno.errors.*`/a hand-rolled class, and never left unwrapped
if it originates from a third-party library or driver. Which one:

| Situation                                                                                                                                                                                                                | Class              | Why                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A genuine client-shaped failure — bad input, not found, forbidden, conflict — where you know the real HTTP status                                                                                                        | `HttpError`        | The only class with `.status`; without it, a client-facing response defaults to `500` (see `@zanix/server`'s `httpErrorResponse`), which would misreport a real client mistake as a server fault.                                                              |
| An unexpected, critical fault the caller didn't cause — a DB/queue connection failure, a config invariant violated, a third-party SDK throwing something you didn't ask for, a `catch` around code that "shouldn't" fail | `InternalError`    | `shouldLog` defaults to `true` — self-logs the moment it's constructed, so failures like these don't depend on every catch site remembering to log them. Resolves to HTTP `500` by default (no `.status` of its own) when it reaches a client-facing response. |
| An expected domain/business-rule failure that isn't shaped like an HTTP status at all (a validation invariant inside a non-HTTP-facing library, a state-machine transition that isn't allowed)                           | `ApplicationError` | `shouldLog` defaults to `false` — expected, recoverable failures shouldn't auto-flood the log the way a genuine `InternalError` should.                                                                                                                        |
| An authorization/authentication failure specifically                                                                                                                                                                     | `PermissionDenied` | Same defaults as `ApplicationError`, but gives permission failures their own catchable type — a caller can `catch (e) { if (e instanceof PermissionDenied) ... }` without string-matching a message or a `code`.                                               |

The dividing line between `InternalError` and `ApplicationError` is **"did the
caller do something wrong, or did something the caller had no control over go
wrong?"** — not severity alone. A DB connector that can't reach its database
is `InternalError` even if it's "just" a connectivity blip, because the
caller's request had nothing to do with it. A validation rule you deliberately
enforce and expect to be hit sometimes is `ApplicationError` even though it's
also "not the server's fault" — because it's the caller's own input, not an
unrelated internal failure surfacing through your code.

A plain `Error` (or a third-party library's own error type) reaching this far
unwrapped is a strong signal something should have been an `InternalError`
instead — see `@zanix/server`'s `httpErrorResponse` default (`500` when there's
no `.status`) for what a client actually sees when that happens, and why the
distinction matters even though both currently resolve to the same status
code by default.

## HttpError

`HttpError` extends Deno's `Http` error class and is meant for HTTP-related
exceptions in web applications or APIs. It associates an `HttpErrorCodes` value
(e.g. `'BAD_REQUEST'`, `'NOT_FOUND'`) with its corresponding numeric HTTP status
through the `status` property, which contains `{ code, value }`.

Outside Deno (e.g. imported into browser-run code, such as a `@zanix/space`
Comet) `HttpError` falls back to extending the plain `Error` class instead,
since `Deno.errors.Http` doesn't exist there —
`.message`/`.status`/`.stack`/`.cause`/`.meta`/`.code` behave identically either
way, as every one of them is set directly in `HttpError`'s own constructor
rather than inherited from its base class.

| Option        | Type                      | Default          | Description                                                                                                                                                                                                            |
| ------------- | ------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`     | `string`                  | the error `code` | The main error message — technical/dev-facing, not meant for an end user (see `userMessage`).                                                                                                                          |
| `shouldLog`   | `boolean`                 | `false`          | Whether to log this error through the system logger on construction.                                                                                                                                                   |
| `meta`        | `Record<string, unknown>` | `undefined`      | Optional metadata attached to the error for internal use.                                                                                                                                                              |
| `userMessage` | `string`                  | `undefined`      | Optional, safe message meant to be shown directly to an end user, when this error is one a caller might realistically surface in a UI. See [Dev-facing vs. user-facing messages](#dev-facing-vs-user-facing-messages). |
| `exposeMeta`  | `boolean`                 | `false`          | Whether `meta` is safe to include in a client-facing response. See [Deciding what a client-facing response includes](#deciding-what-a-client-facing-response-includes).                                                |
| `exposeCause` | `boolean`                 | `false`          | Whether `cause` is safe to include in a client-facing response. Same section as `exposeMeta`.                                                                                                                          |
| `code`        | `string`                  | `undefined`      | Optional internal code identifier (distinct from the HTTP `code`).                                                                                                                                                     |
| `cause`       | `unknown`                 | `undefined`      | Optional inner exception or cause.                                                                                                                                                                                     |
| `id`          | `string`                  | generated UUID   | Identifier used to track or reference the error trace.                                                                                                                                                                 |

```ts
throw new HttpError('NOT_FOUND', {
  message: 'User not found',
  shouldLog: true,
  meta: { userId: '12345' },
})
```

```ts
const error = new HttpError('BAD_REQUEST', {
  message: 'Invalid input provided.',
})
console.log(error.message) // "Invalid input provided."
console.log(error.status.code) // "BAD_REQUEST"
console.log(error.status.value) // 400
```

`shouldLog` defaults to `false` — an `HttpError` is not logged unless you opt in
explicitly.

## ApplicationError

`ApplicationError` extends the native `Error` class and is meant for general
application errors, adding the same tracking properties as `HttpError` (`id`,
`code`, `meta`, `cause`, `shouldLog`) but without any HTTP status mapping.

| Option        | Type                      | Default        | Description                                                                                                                                                              |
| ------------- | ------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `shouldLog`   | `boolean`                 | `false`        | Whether to log this error through the system logger on construction.                                                                                                     |
| `meta`        | `Record<string, unknown>` | `undefined`    | Optional metadata attached to the error for internal use.                                                                                                                |
| `userMessage` | `string`                  | `undefined`    | Optional, safe message meant to be shown directly to an end user — see [Dev-facing vs. user-facing messages](#dev-facing-vs-user-facing-messages).                       |
| `exposeMeta`  | `boolean`                 | `false`        | Whether `meta` is safe to include in a client-facing response — see [Deciding what a client-facing response includes](#deciding-what-a-client-facing-response-includes). |
| `exposeCause` | `boolean`                 | `false`        | Whether `cause` is safe to include in a client-facing response. Same section as `exposeMeta`.                                                                            |
| `code`        | `string`                  | `undefined`    | Optional error code for internal use.                                                                                                                                    |
| `cause`       | `unknown`                 | `undefined`    | Optional inner exception or cause.                                                                                                                                       |
| `id`          | `string`                  | generated UUID | Identifier used to track or reference the error trace.                                                                                                                   |

```ts
const error = new ApplicationError('Something went wrong!', {
  code: 'APPLICATION_ERROR',
  meta: { userId: '12345' },
})
```

Just like `HttpError`, `shouldLog` defaults to `false` for `ApplicationError`.

## PermissionDenied

`PermissionDenied` extends `ApplicationError` without adding any new behavior —
it exists purely to give permission-related failures a more specific type, which
makes catching and reporting them easier. It accepts the same options as
`ApplicationError` (and inherits the same `shouldLog: false` default).

```ts
throw new PermissionDenied('No token provided.')
```

## InternalError

`InternalError` also extends `ApplicationError` and is intended for critical,
runtime server exceptions. It accepts the same options as `ApplicationError`,
with one difference: `shouldLog` defaults to `true` instead of `false`, since
these errors are considered critical and are expected to be logged unless you
explicitly opt out. `InternalError` does not associate any HTTP status or
`status` property — that mapping is specific to `HttpError`.

```ts
throw new InternalError('Invalid input provided.')
console.log(error.message) // "Invalid input provided."
```

```ts
// Opt out of the default logging behavior
throw new InternalError('Invalid input provided.', { shouldLog: false })
```

## httpStates

`httpStates` is a plain object mapping every `HttpErrorCodes` value to its
numeric HTTP status code (e.g. `'BAD_REQUEST'` → `400`, `'NOT_FOUND'` → `404`).
It's the same map `HttpError` uses internally to fill in `status.value`, and
it's handy on its own whenever you need the numeric status without constructing
an error:

```ts
import { httpStates } from 'jsr:@zanix/utils@[version]/errors'

console.log(httpStates.BAD_REQUEST) // 400
console.log(httpStates.NOT_FOUND) // 404
```

It covers the common 4xx client errors (`BAD_REQUEST`, `UNAUTHORIZED`,
`FORBIDDEN`, `NOT_FOUND`, `METHOD_NOT_ALLOWED`, `CONFLICT`, `PAYLOAD_TOO_LARGE`,
`UNSUPPORTED_MEDIA_TYPE`, `UNPROCESSABLE_ENTITY`, `TOO_MANY_REQUESTS`) and 5xx
server errors (`INTERNAL_SERVER_ERROR`, `NOT_IMPLEMENTED`, `BAD_GATEWAY`,
`SERVICE_UNAVAILABLE`, `GATEWAY_TIMEOUT`).

## Serializing errors

`serializeError` converts an error (or any unknown value) into a plain,
serializable object — useful for logs or API responses, where you generally
can't `JSON.stringify` a native `Error` directly and get anything useful back.
If the input is an `Error` instance, it extracts `name`, `message`, and (by
default) `stack`, and recursively serializes `cause` if present. If it isn't an
`Error`, it falls back to a plain `JSON.parse(JSON.stringify(...))` round-trip.
If serialization fails for any reason, the original input is returned as-is.

```ts
import { serializeError } from 'jsr:@zanix/utils@[version]/errors'

const error = new HttpError('BAD_GATEWAY')
const serialized = serializeError(error)
// { name: 'HttpError', message: 'BAD_GATEWAY', stack: '...', id: '...', status: { code: 'BAD_GATEWAY', value: 502 } }

const withoutStack = serializeError(error, { withStackTrace: false })
```

A credential-shaped field anywhere on the error (`meta` above all — a `cause`
chain is serialized, and redacted, the same way, recursively) is redacted before
the result is returned — see
[Logger's own "Redacting sensitive data" section](./logger.md#redacting-sensitive-data)
for exactly what counts as credential-shaped and why. Pass `redact` to change
that per call, same shape and default as `Logger`'s own `redact` option:

```ts
const withCustomPattern = serializeError(error, {
  redact: { pattern: /^internal-id$/i },
})
const withoutRedaction = serializeError(error, { redact: false }) // only if the output is already trusted
```

`serializeMultipleErrors` applies `serializeError` over an array of errors (or
unknown values) in one call — including its own `options`
(`withStackTrace`/`redact`), forwarded to every entry — which is exactly what
`logger.error(message, ...data)` uses internally to serialize every extra
argument passed after the message. It also skips errors that were already
serialized once (tracked through an internal, non-enumerable `_logged` marker)
to avoid logging duplicate entries when the same error instance flows through
multiple `logger.error` calls:

```ts
import { serializeMultipleErrors } from 'jsr:@zanix/utils@[version]/errors'

const serializedErrors = serializeMultipleErrors([
  new HttpError('BAD_GATEWAY'),
  'plain string',
])
```

## Dev-facing vs. user-facing messages

`message` is written for whoever is debugging the failure — it can be as
technical as needed (a driver error string, a validation detail, an internal
identifier) and is what shows up in logs, `cause` chains, and any API response
consumed by another developer's code. It is **not** automatically safe to show
a non-technical end user.

Most errors never reach an end user at all — a failed DB connector, a
rejected internal service call, a background job retry are all things a
_developer_ observes, not something rendered in a UI. For the errors that
_can_ realistically be shown directly to whoever triggered them (a form
submission, a checkout flow, a CLI command a person is running themselves),
set `userMessage` alongside `message`:

```ts
throw new HttpError('CONFLICT', {
  message: 'Unique constraint violation on users.email (value already exists)',
  userMessage: 'That email is already registered. Try signing in instead.',
  code: 'USER_EMAIL_TAKEN',
})
```

`userMessage` is `undefined` unless a caller sets it — there's no generic
fallback synthesized from `message`, since a technical message being _absent_
a safe rewrite is a much better default than silently showing raw internal
detail to an end user. A caller building a user-facing surface (a REST error
response meant for a browser to render as-is, a CLI's own top-level failure
line, an SSR error boundary's fallback UI) should prefer `userMessage` when
present and fall back to a generic, error-agnostic message — never to
`message` — when it isn't.

## Deciding what a client-facing response includes

`meta` and `cause` are, by default, **not** included in a client-facing
response — `@zanix/server`'s `getPublicErrorResponse`/`httpErrorResponse` omit
them unless the error itself opts in via `exposeMeta`/`exposeCause`. Both
still reach anywhere this error gets logged regardless of these flags — a
`Logger`'s `storage.save`, or `@zanix/server`'s own `logAppError` — since
that's `meta`/`cause`'s primary purpose: internal debugging context for
whoever operates the system, not necessarily something the caller who
triggered the error should see.

Most `meta`/`cause` values fall into that "internal only" category — a
connector name, an internal record id, a driver's raw error text, a
downstream service's internal hostname. Only opt in when you've deliberately
shaped one to be safe and useful for the caller:

```ts
// Internal — meta/cause never leave the log, by default. This is the common case.
throw new InternalError('Failed to persist order after payment capture', {
  cause: dbError, // may contain a connection string, a driver-specific detail
  meta: { orderId, attempt: 3 },
})

// Client-facing — meta is deliberately shaped for the caller to act on.
throw new HttpError('UNPROCESSABLE_ENTITY', {
  message: 'Request failed validation',
  meta: { field: 'email', reason: 'invalid_format' },
  exposeMeta: true,
  code: 'VALIDATION_FAILED',
})
```

`exposeMeta`/`exposeCause` only affect what a package building a client-facing
response chooses to include — they carry no behavior of their own inside
`@zanix/utils`. See `@zanix/server`'s own documentation for exactly which
fields a response includes by default.

## See also

- [Logger](./logger.md) — errors are auto-logged through it whenever `shouldLog`
  is `true`
- [Types reference](./types.md) — `ErrorOptions`, `HttpErrors`,
  `SerializeError`, `BaseSerializeError`, `RedactOptions`
