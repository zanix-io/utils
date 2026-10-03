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

## Minimum level

A logger handles every entry by default. Give it a minimum level and anything
below it is dropped: not printed, not redacted, not persisted. The level is one
of `'debug'`, `'info'`, `'warn'`, `'high'`, `'error'` or `'silent'`, from the least
to the most severe.

| Level      | Handles                                    | Drops                                |
| ---------- | ------------------------------------------ | ------------------------------------ |
| `'debug'`  | everything (the default)                   | nothing                              |
| `'info'`   | `info`, `success`, `warn`, `high`, `error` | `debug`                              |
| `'warn'`   | `warn`, `high`, `error`                    | `debug`, `info`, `success`           |
| `'high'`   | `high`, `error`                            | `debug`, `info`, `success`, `warn`   |
| `'error'`  | `error`                                    | everything else, **`high` included** |
| `'silent'` | nothing                                    | every entry, `error` included        |

`success` ranks with `info`. `high` sits between `warn` and `error`, so a
logger set to `'error'` does not handle `high` entries: choose `'high'` to keep
both. A level only drops entries; it never turns a method that does not persist
(`debug`, `success`) into one that does, and persistence still follows the
storage you configured.

### Setting the level

There are three ways, in this order of precedence:

1. The `level` option of a `Logger`:

   ```ts
   const logger = new Logger({ level: 'warn' })
   ```

2. The `LOG_LEVEL` environment variable (exported as the constant `LOG_LEVEL_ENV`),
   read once when a `Logger` is created without a `level`. The value is trimmed
   and case-insensitive, and an empty or missing value is the default:

   ```sh
   LOG_LEVEL=warn deno run -A main.ts
   ```

   Reading it needs the `--allow-env` permission for `LOG_LEVEL` (or `-A`);
   without that permission the variable is treated as not set, and nothing
   prompts. The default `logger` instance created by importing
   `@zanix/utils/logger` reads it at import time.

3. `logger.setLevel(level)` at run time, for that instance only. `logger.getLevel()`
   returns the current level.

When nothing is set the level is `'debug'`, so a program that never configures
a level behaves exactly as before.

A value that is not a level (`LOG_LEVEL=loud`, `new Logger({ level: 'loud' })`) is
reported once, with the accepted values, and treated as not given: the logger
falls back to the next source and, finally, to `'debug'`. A typo therefore never
hides logs and never stops the process. `setLevel` with such a value leaves the
current level as it is.

The browser-safe `createClientLogger` has no environment: it takes the level
from its own option and defaults to `'debug'`.

```ts
import { createClientLogger } from 'jsr:@zanix/utils@[version]/logger/client'

const logger = createClientLogger(send, { level: 'warn' })
```

### Asking before doing costly work

`logger.isLevelEnabled(method)` answers whether an entry of that method would be
handled, so an argument that is expensive to build is built only when it will be
used:

```ts
if (logger.isLevelEnabled('debug')) logger.debug('state', buildExpensiveSnapshot())
```

It answers for the level only. Whether the entry is also persisted depends on the
method and the storage.

### Relayed entries and errors

`Logger#ingest` applies the level to the severity of the relayed entry: an
`info` entry arriving at a logger set to `'warn'` is dropped, so a browser client
cannot make the server store what the server itself would not.

`logger.error` checks the level before it serializes anything. An error dropped
by the level is not marked as logged, so a logger with a lower level, or the
same one after `setLevel`, still logs it later.

## Measuring how long something takes

A log that says an operation happened does not say where the time went. `timer`
and `time` log a duration through the same redaction, formatting and storage as
every other entry, so the number sits next to everything else the logger
records:

```ts
import logger from 'jsr:@zanix/utils@[version]/logger'

// Around one call. A synchronous function stays synchronous, an async one stays
// async, and the return value is the function's own.
const user = await logger.time('users.find', () => users.find(id))

// Or hold the timer, when start and end are in different places.
const timer = logger.timer('checkout', { metadata: { cartId } })
await charge(cart)
timer.stop({ items: cart.length }) // returns the duration in milliseconds
```

The console shows `checkout took 12.3ms` followed by the data, and the stored
entry carries three stable fields in its `data`:

```json
{
  "level": "info",
  "message": "checkout took 12.3ms",
  "data": [{ "cartId": "c1", "items": 3, "label": "checkout", "durationMs": 12.35, "status": "ok" }]
}
```

- `durationMs` is a number of milliseconds with two decimals, measured with a
  monotonic clock (`performance.now()`), so it never jumps when the system time
  changes.
- `label` is what you passed. Keep it a fixed name (an operation or a route
  pattern, `GET /users/:id`), never something built from user input or a secret:
  redaction works by key name, and a label is part of the message.
- `status` is `'ok'`, or `'error'` when the measured function failed.

### Which level, and what is persisted

The default level is `'debug'`: the entry is printed and never persisted, so
timing every call costs a console line and nothing else. Choose what to keep:

| Option            | Effect                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `level`           | `'debug'` (default), `'info'`, `'warn'` or `'high'`. `'error'` is not accepted.                                                            |
| `slowThresholdMs` | Log only measurements that took at least this long; faster ones are dropped. Then the default level is `'warn'`, so the slow ones persist. |
| `noSave`          | Print, but never persist, even at a level that persists.                                                                                   |
| `metadata`        | Extra fields, redacted by key. The fixed fields cannot be overridden from here.                                                            |
| `clock`           | A custom monotonic clock in milliseconds, for tests.                                                                                       |

```ts
// Persist only the slow ones: a query that takes 200 ms or more is a warn entry.
await logger.time('db.query', () => db.query(sql), { slowThresholdMs: 200 })
```

The logger's [minimum level](#minimum-level) applies to measurements too. A
measurement below `slowThresholdMs` costs two clock readings and a closure, and
logs nothing, and one whose level is dropped is not built:

- `time` takes a fast path, running only the function, when the measurement
  could never be logged: its own level and `'warn'` (the level a failure is
  raised to) are both below the minimum. No clock is read, no closure is
  created and the metadata is not touched. A function under
  `LOG_LEVEL=error` costs the same as the function alone.
- When only the measurement's own level is dropped (`LOG_LEVEL=info` with the
  default `'debug'` level), the function is still measured so that a failure can
  be logged at `'warn'` with its duration. A successful run is dropped before
  anything is built.
- `slowThresholdMs` raises the default level to `'warn'`, so under `LOG_LEVEL=warn` a
  slow measurement is logged and a fast one is dropped.
- `timer` returns the duration from `stop()` and `elapsed()`, so it keeps reading
  the clock even when nothing could be logged; it only skips building and logging
  the entry.

### Failures

If the function passed to `time` throws, or its promise rejects, the
measurement is still logged, with `status: 'error'`, the error's `errorName`
(and `errorCode` when it has a string `code`), and a level raised to `'warn'`
when it would have been `'debug'` or `'info'`. The original error is rethrown
untouched:

- it is not wrapped, and its identity is the same one the caller catches;
- it is not logged here and not marked as logged, so `logger.error(error)`
  further up the stack still prints it once, as usual;
- its `message`, `stack` and `cause` are deliberately not recorded, because they
  can carry data that does not belong in a timing log.

A measurement is also logged when it was faster than `slowThresholdMs` if it
failed. Logging never throws into the measured code: a custom `save` that throws
or rejects does not change what `time` returns.

### `using`

A timer implements `Symbol.dispose`, so a scope can end it:

```ts
{
  using timer = logger.timer('render')
  await render()
} // logs `render took ...` here, including when `render` throws
```

An exception that leaves the scope is logged as a normal measurement; use `time`
to record the failure.

### Pure helpers

`@zanix/utils/helpers` exports the building blocks without any logging:
`measure(fn)` returns `{ result, durationMs }`, `startTimer()` returns a function
that reads the elapsed time, `formatDuration(ms)` gives `12.3ms` / `1.25s`, and
`serverTimingHeader(entries)` builds the value of a `Server-Timing` response
header. See [Helpers](./helpers.md#timing).

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
endpoint (another service, a mobile app, ...). It's merged onto the persisted
log as a TOP-LEVEL `origin` field (`DefaultFormattedLog.origin`), sibling to
`timestamp`/`level`/etc. — not buried inside `data` — so a stored/queried log
can be filtered or aggregated by origin directly:

```json
{
  "id": "1c49db8c-8b76-4c32-b293-51eca9d8e899",
  "level": "warn",
  "message": "Something worth a look, from the browser",
  "timestamp": "2026-08-24T16:59:03.179Z",
  "context": { "processId": 501 },
  "data": [{ "extra": "data" }],
  "origin": "client"
}
```

`ingest` redacts and persists the raw data given exactly as `warn`/`error`/etc.
would. Unlike `debug`/`success`, it never appends `'noSave'` itself, so it
always attempts to persist by default — a caller's own raw data genuinely
ending with the literal string `'noSave'` is still honored, exactly as it
would be for any local call, so a relayed browser log persists through
whichever backend the server's own `Logger` instance is already configured
with (file,
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
