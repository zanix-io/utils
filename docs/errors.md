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

| Option      | Type                      | Default          | Description                                                          |
| ----------- | ------------------------- | ---------------- | -------------------------------------------------------------------- |
| `message`   | `string`                  | the error `code` | The main error message.                                              |
| `shouldLog` | `boolean`                 | `false`          | Whether to log this error through the system logger on construction. |
| `meta`      | `Record<string, unknown>` | `undefined`      | Optional metadata attached to the error for internal use.            |
| `code`      | `string`                  | `undefined`      | Optional internal code identifier (distinct from the HTTP `code`).   |
| `cause`     | `unknown`                 | `undefined`      | Optional inner exception or cause.                                   |
| `id`        | `string`                  | generated UUID   | Identifier used to track or reference the error trace.               |

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

| Option      | Type                      | Default        | Description                                                          |
| ----------- | ------------------------- | -------------- | -------------------------------------------------------------------- |
| `shouldLog` | `boolean`                 | `false`        | Whether to log this error through the system logger on construction. |
| `meta`      | `Record<string, unknown>` | `undefined`    | Optional metadata attached to the error for internal use.            |
| `code`      | `string`                  | `undefined`    | Optional error code for internal use.                                |
| `cause`     | `unknown`                 | `undefined`    | Optional inner exception or cause.                                   |
| `id`        | `string`                  | generated UUID | Identifier used to track or reference the error trace.               |

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

## See also

- [Logger](./logger.md) — errors are auto-logged through it whenever `shouldLog`
  is `true`
- [Types reference](./types.md) — `ErrorOptions`, `HttpErrors`,
  `SerializeError`, `BaseSerializeError`, `RedactOptions`
