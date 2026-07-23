# Logger

The `/logger` subpath ships a small `Logger` class intended to replace direct usage of `console` across a project, improving log quality and keeping a consistent format. Every log call still prints to the console (using the matching `console.info`/`console.debug`/`console.warn`/`console.error` method under the hood, each prefixed with an icon and a `ZNX-*` tag), and on top of that most levels are also persisted through a configurable storage strategy. `@zanix/utils/logger` exports a default, ready-to-use `logger` instance plus the `Logger` class itself for creating custom instances.

```ts
import logger, { Logger } from 'jsr:@zanix/utils@[version]/logger'
```

## Quick usage

The default export is already an instance of `Logger`, so you can use it right away without configuration:

```ts
import logger from 'jsr:@zanix/utils@[version]/logger'

logger.info('Server started', { port: 3000 })
logger.warn('Cache miss', { key: 'user:42' })
logger.error('Failed to fetch user', someError)
logger.debug('Incoming payload', { body: requestBody })
logger.success('Migration completed')
```

`info`, `warn` and `error` are persisted according to the configured storage strategy (by default, JSON files under the `.logs` folder). `debug` and `success`, however, are **never persisted**, even with the default logger — they are only printed to the console and are meant for local development or informational purposes, since they tend to generate high volumes of noise without carrying critical information. `error` also has a special behavior: it serializes any values passed after the message using `serializeMultipleErrors`, which marks each one internally (`_logged`) the first time it's serialized. If you pass the exact same error object to `logger.error(...)` again later (e.g. it's caught and re-logged further up the call stack), that duplicate is filtered out — and if _every_ extra argument turns out to be such a duplicate, the whole call is skipped entirely (nothing is printed to the console or saved), preventing the same error from being logged twice.

## Creating a custom Logger

Instantiating `new Logger(options)` lets you fully control how (and whether) logs are stored. All five configuration styles below are supported by the `storage` option.

### 1. Custom save function

Provide your own `save` function to route formatted logs anywhere you want. It can be synchronous or asynchronous:

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

If you don't need a custom sink, `save` can instead be an options object describing where logs should be written on disk. Files default to the `.logs` folder and expire after 5 days:

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

For heavy or resource-intensive log storage, `useWorker: true` runs the save operation in a one-time `WorkerManager` worker instead of the main thread. Since the call becomes asynchronous from the caller's perspective, pass a `callback` if you need to know when it finishes:

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

The `formatter` option lets you reshape the log object before it reaches the save function or file, regardless of which storage style you picked:

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

Logs are saved according to whatever storage strategy is configured; if none is defined, they fall back to the `.logs` folder. To disable persistence entirely (while still printing to the console), you have two options: disable storage for the whole instance with `storage: false`, or skip a single call by passing the `'noSave'` flag as the last argument.

```ts
import { Logger } from 'jsr:@zanix/utils@[version]/logger'

// No log produced by this instance is ever persisted
const logger = new Logger({ storage: false })
logger.info('This is only printed to the console')

// Or, with any logger, opt a single call out of persistence
logger.info('Some info without saving', 'noSave')
```

Remember that `debug` and `success` are excluded from persistence by default regardless of the storage strategy, so `noSave`/`storage: false` mainly matter for `info`, `warn` and `error`.

## Accessing the logger globally

Creating a `new Logger()` instance stores it both on `globalThis` and on the `Zanix` (`Znx`) namespace, unless you pass `disableGlobalAssign: true`. This means the most recently created instance becomes accessible from anywhere via `Znx.logger` or `self.logger`, without importing it explicitly:

```ts
import 'jsr:@zanix/utils@[version]/logger' // ensures the library (and the default instance) is loaded

Znx.logger.debug('message to log') // accessing via the Zanix namespace
self.logger.debug('message to log') // accessing via the global context
```

You can also declare a global `logger` constant, or extend the `Window` interface, to get type-safe access without an explicit import in every file:

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
- [Types reference](./types.md) — `LoggerFormatter`, `LoggerSaveData`, `LoggerMethods`, `LoggerData`, `DefaultResponse`, `DefaultFormattedLog`, `BaseFormattedLog`
