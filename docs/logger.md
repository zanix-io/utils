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
logger.error('Failed to fetch user', someError)
logger.debug('Incoming payload', { body: requestBody })
logger.success('Migration completed')
```

`info`, `warn` and `error` are persisted according to the configured storage
strategy (by default, JSON files under the `.logs` folder). `debug` and
`success`, however, are **never persisted**, even with the default logger — they
are only printed to the console and are meant for local development or
informational purposes, since they tend to generate high volumes of noise
without carrying critical information.

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

// Keep redaction on, but match this project's own conventions instead of the built-in pattern.
const logger = new Logger({
  redact: { pattern: /^(authorization|x-internal-.*)$/i },
})
```

A custom `pattern` **replaces** the built-in one rather than extending it — if
you still want the built-in credential names redacted too, include them in your
own pattern.

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
