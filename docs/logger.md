# Logger

The `/logger` subpath ships a small `Logger` class intended to replace direct
usage of `console` across a project, improving log quality and keeping a
consistent format. Every log call still prints to the console (using the
matching `console.info`/`console.debug`/`console.warn`/`console.error` method
under the hood, each prefixed with an icon and a `ZNX-*` tag), and on top of
that most levels are also persisted through a configurable storage strategy.
`@zanix/utils/logger` exports a default, ready-to-use `logger` instance plus the
`Logger` class itself for creating custom instances.

```ts
import logger, { Logger } from 'jsr:@zanix/utils@[version]/logger'
```

## Quick usage

The default export is already an instance of `Logger`, so you can use it right
away without configuration:

```ts
import logger from 'jsr:@zanix/utils@[version]/logger'

logger.info('Server started', { port: 3000 })
logger.warn('Cache miss', { key: 'user:42' })
logger.high('Retry budget exhausted for job "sync-catalog", falling back to manual mode', context)
logger.error('Failed to fetch user', someError)
logger.debug('Incoming payload', { body: requestBody })
logger.success('Migration completed')
```

`info`, `warn`, `high` and `error` are persisted according to the configured
storage strategy (by default, JSON files under the `.logs` folder). `debug` and
`success`, however, are **never persisted**, even with the default logger — they
are only printed to the console and are meant for local development or
informational purposes, since they tend to generate high volumes of noise
without carrying critical information.

### `high`: between `warn` and `error`

`high` is for an anomalous condition that deserves attention sooner than a
routine `warn` — but where the operation itself didn't necessarily fail
outright, unlike `error`. It prints with its own color (magenta, not shared
with `warn`'s yellow or `error`'s red, so it reads as its own severity tier at
a glance) and, under the hood, through `console.error` rather than
`console.warn` — so log aggregators that only elevate stderr-level output
still surface it. It does **not** perform `error`'s own already-logged
(`_logged`) dedup against `Error` instances — pass one the same way you would
to `warn`, as plain extra data.

Use `warn` for something anomalous but routine/expected (a cache miss, a
degraded-but-functioning fallback). Reach for `high` when the same kind of
"not a hard failure" condition is significant enough that an operator
shouldn't have to go looking for it — a retry budget exhausted before falling
back, a security-relevant pattern (e.g. repeated failed auth attempts from one
session) that isn't itself an error. Reserve `error` for an operation that
actually failed.

Any `Error` instance passed as an extra argument to `info`/`warn`/`error` — e.g.
`logger.warn('Sync failed, continuing without it', someError)` — is serialized
(via the same `name`/`message`/`stack`/`cause` extraction `serializeError` does)
before being handed to the default formatter. This matters specifically for
persistence: an `Error`'s own properties are non-enumerable, so
`JSON.stringify(someError)` silently collapses it to `{}` — fine for
`console.warn`'s own inspection, but a real trap for any storage strategy that
ends up JSON-encoding the formatted log (a custom formatter that stores `data`
as-is gets the same guarantee; one that reshapes `data` into something else is
responsible for its own serialization). `error` additionally has a special
behavior on top of this: it runs its extra arguments through
`serializeMultipleErrors`, which marks each one internally (`_logged`) the first
time it's serialized. If you pass the exact same error object to
`logger.error(...)` again later (e.g. it's caught and re-logged further up the
call stack), that duplicate is filtered out — and if _every_ extra argument
turns out to be such a duplicate, the whole call is skipped entirely (nothing is
printed to the console or saved), preventing the same error from being logged
twice.

## Creating a custom Logger

Instantiating `new Logger(options)` lets you fully control how (and whether)
logs are stored. All six configuration styles below are supported by the
`storage` option.

### 1. Custom save function

Provide your own `save` function to route formatted logs anywhere you want. It
can be synchronous or asynchronous:

```ts
import { Logger } from 'jsr:@zanix/utils@[version]/logger'

const logger = new Logger({
  storage: {
    async save(context) {
      const data = context.getFmtLog()
      // send `data` to your own storage, database, external service, etc.
    },
  },
})

await logger.debug('Some debug information') // the save function is invoked and awaited
```

### 2. File-based storage with expiration

If you don't need a custom sink, `save` can instead be an options object
describing where logs should be written on disk. Files default to the `.logs`
folder and expire after 5 days:

```ts
import { Logger } from 'jsr:@zanix/utils@[version]/logger'

const logger = new Logger({
  storage: {
    save: {
      folder: 'myCustomFolder', // custom folder for saving logs
      expirationTime: '1d', // custom expiration time for log files
    },
  },
})

await logger.warn('Some warning to save in a file')
```

### 3. Offloading storage to a worker

For heavy or resource-intensive log storage, `useWorker: true` runs the save
operation in a one-time `WorkerManager` worker instead of the main thread. Since
the call becomes asynchronous from the caller's perspective, pass a `callback`
if you need to know when it finishes:

```ts
import { Logger } from 'jsr:@zanix/utils@[version]/logger'

const logger = new Logger({
  storage: {
    save: {
      useWorker: true, // enable a one-time worker for processing logs
      callback: () => {}, // optional callback invoked once the worker finishes
    },
  },
})
```

### 4. Custom formatter

The `formatter` option lets you reshape the log object before it reaches the
save function or file, regardless of which storage style you picked:

```ts
import { Logger } from 'jsr:@zanix/utils@[version]/logger'

const logger = new Logger({
  storage: {
    formatter: (level, logData) => ({ level, data: logData }), // your custom log processing logic
  },
})

await logger.info('Some info to save in a custom format')
```

### 5. Preventing log saving

Logs are saved according to whatever storage strategy is configured; if none is
defined, they fall back to the `.logs` folder. To disable persistence entirely
(while still printing to the console), you have two options: disable storage for
the whole instance with `storage: false`, or skip a single call by passing the
`'noSave'` flag as the last argument.

```ts
import { Logger } from 'jsr:@zanix/utils@[version]/logger'

// No log produced by this instance is ever persisted
const logger = new Logger({ storage: false })
logger.info('This is only printed to the console')

// Or, with any logger, opt a single call out of persistence
logger.info('Some info without saving', 'noSave')
```

Remember that `debug` and `success` are excluded from persistence by default
regardless of the storage strategy, so `noSave`/`storage: false` mainly matter
for `info`, `warn` and `error`.

### 6. Building a reusable storage backend

Style 1 (custom save function) works well for a one-off sink written inline, but
a backend meant to be shared across projects — a database, a message queue, a
search/observability service — reads better as a small **factory**: a function
that takes your own options object and _returns_ a `SaveDataFunction`. From
`Logger`'s point of view the result is indistinguishable from writing the
function by hand (style 1); the factory just saves every caller from
re-implementing the same plumbing (buffering, retries, batching, ...)
themselves:

```ts
import type { SaveDataFunction } from 'jsr:@zanix/utils@[version]/types'

function myBackendSave(options: MyBackendOptions): SaveDataFunction {
  // set up whatever the backend needs once (a client, a buffer, ...), reading `options` here
  return async (context) => {
    const data = context.getFmtLog()
    // send `data` to the backend
  }
}
```

```ts
import { Logger } from 'jsr:@zanix/utils@[version]/logger'

const logger = new Logger({
  storage: { save: myBackendSave({/* your options */}) },
})
```

This is deliberately **not** a third special shape recognized by `Logger` itself
(unlike style 2's plain options object, which `Logger` only understands because
file-based storage is its own built-in default) — `Logger` stays unaware of what
any particular backend is or does, keeping `@zanix/utils` free of a dependency
on that backend's client/SDK. A real example following this exact pattern is
`@zanix/datamaster`'s `elasticsearchLogSave` (from its `/observability`
subpath), which persists logs to Elasticsearch/OpenSearch via
`@zanix/datamaster`'s own connector conventions, entirely outside of
`@zanix/utils`.

One detail worth knowing if you're writing a backend like this: `getFmtLog()`'s
default output already includes a `timestamp` field (an ISO-8601 string). A
backend that talks to a system with its own timestamp convention — for instance,
Elasticsearch/OpenSearch's `@timestamp`, which Kibana/ OpenSearch Dashboards
look for by default — can simply alias that existing field
(`{ ...data, '@timestamp': data.timestamp }`) instead of generating a new one at
send time. Since a fully custom `formatter` can omit `timestamp` entirely (or
name it something else), a backend doing this kind of aliasing should fall back
to synthesizing its own timestamp only when nothing suitable is already present
— that way it works with the default formatter, a custom one that keeps a
timestamp under a different name, and one that has no time field at all, without
`Logger` ever needing to know why.

### 7. Browser clients: `createClientLogger` and `Logger#ingest`

`new Logger(...)`'s own default storage (style 2 above) reads/writes files via
`Deno.readTextFile`/`Deno.writeTextFile`, and its optional worker offload
(style 3) spawns a real `Deno.Worker` — neither exists in a browser, and
importing `Logger` transitively pulls both in regardless of which storage
style a caller actually configures, since they're part of the same module
graph a bundler has to resolve. `createClientLogger` is the browser-safe
alternative: a `Logger` whose default storage is a genuine no-op instead of a
file, so importing it never reaches either.

```ts
import { createClientLogger } from 'jsr:@zanix/utils@[version]/logger/client'

const logger = createClientLogger((fmtLog) =>
  fetch('/api/log', { method: 'POST', body: JSON.stringify(fmtLog) })
)

logger.warn('Something worth a look, from the browser')
```

By default, the returned instance never claims `globalThis.logger`/`Znx.logger` in the
browser — every real consumer imports it directly (see `@zanix/space`'s own shared
`client-logger.ts` module for the pattern). Pass a second argument to opt back in, e.g.
for a `window.logger`-style debugging convenience in a dev build:

```ts
const logger = createClientLogger(fetcher, { disableGlobalAssign: false })
```

`createClientLogger`'s `fetcher` receives one already-formatted log entry per
call as a typed object (`BaseFormattedLog`, `DefaultFormattedLog` by
default) — never `JSON.stringify`'d on its behalf, so the fetcher decides
whether/how to serialize it. It's typically sent to this app's own backend
endpoint, which then persists it through the SAME pipeline a server-side log
already uses via `Logger#ingest`:

```ts
// the app's own backend route, e.g. `POST /api/log`
import logger from 'jsr:@zanix/utils@[version]/logger'

// `level`, not `type` — the field `DefaultFormattedLog` (what `fetcher` above actually received
// and serialized) itself uses for severity. `ingest`'s own parameter is called `type`, but that's
// just its own local name — pass whatever field the formatted log itself carries positionally.
const { level, origin, ...data } = await request.json()
logger.ingest(level, origin, data.message, data)
```

`ingest`'s second parameter, `origin`, defaults to `'client'` when omitted —
`ingest`'s only real use is relaying an entry a BROWSER client's own
`createClientLogger` instance already logged, so that's the sensible default;
pass an explicit value for a non-browser origin relaying through the same
endpoint (another service, a mobile app, ...). It's appended onto the
persisted log's own data as `{ origin }`, so a stored/queried log can be told
apart from one this instance logged locally itself.

`ingest` redacts and persists the raw data given exactly as `warn`/`error`/etc.
would — never `noSave` — so a relayed browser log persists through whichever
backend the server's own `Logger` instance is already configured with (file,
Elasticsearch, a custom sink), with no separate wiring needed for
browser-originated logs. Unlike every other log method, it skips the console
print step: the remote origin already surfaced this entry through its own
console/UI, so printing it again here would misrepresent a relayed remote
event as a genuine local one on this process's own console.

A server-side caller that wants file-based storage explicitly — bypassing
`Logger`'s own automatic default, or building a `createClientLogger`-style
factory of its own — imports `saveDataFileFunction` alongside `Logger`:

```ts
import { Logger, saveDataFileFunction } from 'jsr:@zanix/utils@[version]/logger'

const logger = new Logger({
  storage: { save: saveDataFileFunction({ folder: 'myCustomFolder' }) },
})
```

## Redacting sensitive data

Every log — console output and whatever storage strategy you picked — is
redacted by default before it's written anywhere. A credential-shaped field
(`authorization`, `cookie`, `password`, `token`, `secret`, `apiKey`, and similar
names, matched case-insensitively) has its value replaced with `[REDACTED]`, and
a raw `Headers`/`Request` object is converted to its safe, named fields
(`method`/`url`/`headers`) before that same key-based redaction applies to it —
this covers a case `JSON.stringify` alone would miss: a `Headers`/`Request`
value serializes to `{}` under `JSON.stringify`, but Deno's own console
inspector still prints its full contents, `Authorization` included, when one is
logged directly or nested inside another object.

The default set also covers common PII/PCI form-field naming beyond classic
HTTP credentials: `newPassword`/`confirmPassword`/`oldPassword`/
`currentPassword`, `creditCardNumber`/`cardNumber`, `ssn`, `cvv`/`cvc`,
`pinCode`/`securityPin`, and `bankAccountNumber`/`bankAccount`. A bare `pin` is
deliberately **not** matched — unlike `ssn`/`cvv`, it collides too often with
ordinary non-sensitive usage (a pinned dependency version, a UI "pin" action, a
GPIO pin); redact a genuinely bare `pin` field via `redact.extend` instead.

**This is key-name matching only, not content scanning.** The redactor never
looks at a string's _content_ to guess whether it looks like a credential —
only whether the _field it's stored under_ is named like one. A secret pasted
into a field named `notes`, `description`, or any other name this pattern
doesn't recognize reaches the log untouched. If your domain has its own
sensitive field names this default doesn't cover (a `taxId`, an internal
`licenseKey`, ...), add them via `redact.extend` — don't rely on the default
alone for anything domain-specific.

```ts
import { Logger } from 'jsr:@zanix/utils@[version]/logger'

const logger = new Logger()
logger.warn('Login attempt', { token: 'abc123', headers: someRequest.headers })
// printed/saved as: Login attempt { token: '[REDACTED]', headers: { authorization: '[REDACTED]', ... } }
```

This applies uniformly to `info`/`warn`/`debug`/`error` and to `Error`s passed
as extra arguments (a credential-shaped field on an error's own `meta` is
redacted the same way, while `name`/`message`/`stack` are always preserved).

Use the `redact` option to change this per instance:

```ts
import { Logger } from 'jsr:@zanix/utils@[version]/logger'

// Disable redaction entirely — only do this if this logger's output is already fully trusted
// (e.g. it never receives request/header data or user input).
const trustedLogger = new Logger({ redact: false })

// Also redact a couple of extra key names, on top of (not instead of) the built-in pattern — the
// common case, and the one to reach for first: a plain string matches a key name exactly,
// case-insensitively, same as every built-in entry; a RegExp matches more broadly (e.g. any key
// ending in "Secret").
const logger = new Logger({
  redact: { extend: ['dbPassword', /secret$/i] },
})

// Match this project's own conventions instead of the built-in pattern entirely — `pattern`
// *replaces* the built-in set rather than extending it; combine it with `extend` (composed on top
// of whichever `pattern` applies) if you still want a couple of extra names beyond your own set.
const customLogger = new Logger({
  redact: { pattern: /^(authorization|x-internal-.*)$/i },
})
```

### Changing the default for every caller, not just one `Logger`

`redact` on a specific `new Logger(...)` only affects that instance's own
console/storage output. Other code that also redacts sensitive data — most
notably `serializeError` (from `@zanix/utils/errors`) when called with no
`redact` option of its own, which is exactly how packages like `@zanix/server`
build client-facing error responses — still falls back to the built-in pattern
regardless of what any particular `Logger` was configured with. Use
`setDefaultRedactOptions` to change that shared fallback itself, once, for the
whole process:

```ts
import { setDefaultRedactOptions } from 'jsr:@zanix/utils@[version]/errors'

// Same shape as `Logger`'s own `redact` option — applies to every caller that doesn't pass its
// own `redact`/`pattern` explicitly, not just a `Logger` instance.
setDefaultRedactOptions({ pattern: /^(authorization|x-internal-.*)$/i })
// or: setDefaultRedactOptions(false) to disable that fallback entirely
```

An explicit `redact` — whether on a `Logger` or passed directly to
`serializeError` — always wins over this default, at any call site.

`DEFAULT_REDACT_PATTERN` (also from `@zanix/utils/errors`) is the built-in
credential-key pattern itself — the effective pattern whenever nothing has
overridden it via `setDefaultRedactOptions`. Compose against it directly, or
use it to restore the process-wide default in a test that changed it and
needs to clean up after itself:

```ts
import { DEFAULT_REDACT_PATTERN, setDefaultRedactOptions } from 'jsr:@zanix/utils@[version]/errors'

setDefaultRedactOptions({ pattern: /^(authorization|x-internal-.*)$/i })
// ...test body...
setDefaultRedactOptions({ pattern: DEFAULT_REDACT_PATTERN }) // restore the built-in default
```

`RedactOptions.extend` is still the more convenient way to add a key name on
top of the built-in pattern without reconstructing it by hand.

## Accessing the logger globally

Creating a `new Logger()` instance stores it both on `globalThis` and on the
`Zanix` (`Znx`) namespace, unless you pass `disableGlobalAssign: true`. This
means the most recently created instance becomes accessible from anywhere via
`Znx.logger` or `self.logger`, without importing it explicitly:

```ts
import 'jsr:@zanix/utils@[version]/logger' // ensures the library (and the default instance) is loaded

Znx.logger.debug('message to log') // accessing via the Zanix namespace
self.logger.debug('message to log') // accessing via the global context
```

You can also declare a global `logger` constant, or extend the `Window`
interface, to get type-safe access without an explicit import in every file:

```ts
declare global {
  const logger: typeof yourNewLoggerInstance
}
```

```ts
declare global {
  interface Window {
    logger: DefaultLogger
  }
}
```

## See also

- [Errors](./errors.md)
- [Types reference](./types.md) — `LoggerFormatter`, `LoggerSaveData`,
  `LoggerMethods`, `LoggerData`, `DefaultResponse`, `DefaultFormattedLog`,
  `BaseFormattedLog`, `LoggerOptions`, `LoggerFunctionOptions`,
  `LoggerFileOptions`, `SaveDataFunctionOptions`, `SaveDataFile`,
  `SaveDataFileOptions`, `RedactOptions`
