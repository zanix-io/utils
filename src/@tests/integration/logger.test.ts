import { assert, assertEquals, assertExists, assertMatch } from '@std/assert'
import { getLogFileName } from 'modules/logger/defaults/storage/file.ts'
import { serializeError } from 'modules/errors/serialize.ts'
import { fileExists } from 'modules/helpers/files.ts'
import { canUseZnx } from 'modules/helpers/zanix/namespace.ts'
import { ISO_DATETIME_REGEX, UUID_REGEX } from 'utils/regex.ts'
import { Logger } from 'modules/logger/main.ts'
import { HttpError } from 'modules/errors/main.ts'
import { stub } from '@std/testing/mock'

// Disable logs by testing
stub(console, 'error')
const info = stub(console, 'info')
stub(console, 'debug')
stub(console, 'warn')

Deno.test(
  'Define a logger with a custom save function and default formatter without global assing.',
  async () => {
    // Instantiate the logger with custom storage configuration.
    const logger = new Logger({
      disableGlobalAssign: true,
      storage: {
        save(context) {
          const data = context.getFmtLog()
          return Promise.resolve(data)
          // Function to save the logs asynchronously
        },
      },
    })

    await logger.success('test message')
    assertEquals(info.calls[0].args[1], 'test message')
    info.restore()

    const debugData = await logger.debug('test message', {
      data: 'data debug',
    })
    assert(!debugData)

    const returned = await logger.warn('test message', { data: 'data warn' })

    assertExists(returned)
    assertMatch(returned.id, UUID_REGEX)
    assertMatch(returned.timestamp, ISO_DATETIME_REGEX)
    assertEquals(returned.level, 'warn')
    assertEquals(returned.message, 'test message')
    assertEquals(returned.data, [{ data: 'data warn' }])

    const globalZnxLogger = await logger.info('info message')
    assertExists(globalZnxLogger)
    assert(!globalZnxLogger.data)
    assertEquals(globalZnxLogger.level, 'info')
    assertEquals(globalZnxLogger.message, 'info message')

    const globalSelfLogger = await logger.error('this is an error')
    assertExists(globalSelfLogger)
    assert(!globalSelfLogger.data)
    assertEquals(globalSelfLogger.level, 'error')
    assertEquals(globalSelfLogger.message, 'this is an error')

    const error = new HttpError('BAD_GATEWAY')
    const serializedErrorLog = await logger.error(
      'this is a serialized error',
      error,
    )
    assertEquals(serializedErrorLog?.data, [serializeError(error)])
  },
)

Deno.test(
  'logger.high persists like warn/error, and respects the explicit noSave flag',
  async () => {
    const logger = new Logger({
      disableGlobalAssign: true,
      storage: {
        save(context) {
          const data = context.getFmtLog()
          return Promise.resolve(data)
        },
      },
    })

    const returnedHigh = await logger.high(
      'Retry budget exhausted for job "sync-catalog", falling back to manual mode',
      { attempts: 5 },
    )
    assertExists(returnedHigh)
    assertEquals(returnedHigh.level, 'high')
    assertEquals(
      returnedHigh.message,
      'Retry budget exhausted for job "sync-catalog", falling back to manual mode',
    )
    assertEquals(returnedHigh.data, [{ attempts: 5 }])

    const skippedHigh = await logger.high(
      'Retry budget exhausted for job "sync-catalog", falling back to manual mode',
      { attempts: 5 },
      'noSave',
    )
    assert(!skippedHigh)
  },
)

Deno.test(
  'Define a logger that saves logs to a file in a specific folder without global assing',
  async () => {
    const customFolder = '.logs/myCustomFolder'
    // Instantiate the logger with custom storage configuration.
    const logger = new Logger({
      disableGlobalAssign: true,
      storage: {
        save: {
          folder: customFolder, // Your custom folder for saving logs
          expirationTime: '1d', // Your custom expiration time for log files
        },
        // Other storage properties
      },
    })

    await logger.warn('be careful, this is a test', { message: 'warning' })
    await logger.info('this is an info test')

    const log = JSON.parse(
      await Deno.readTextFile(customFolder + '/' + getLogFileName()),
    )

    assertExists(log[0].id)
    assertExists(log[0].timestamp)
    assertEquals(log[0].level, 'warn')
    assertEquals(log[0].message, 'be careful, this is a test')
    assertEquals(log[0].data[0].message, 'warning')

    assertEquals(log[1].level, 'info')
    assertEquals(log[1].message, 'this is an info test')
    assert(!log[1].data)

    await Deno.remove(customFolder, { recursive: true })
  },
)

Deno.test('Define a custom log formatter to modify how the logs are saved', async () => {
  if (canUseZnx()) Znx.config.project = 'space' // Necessary to avoid testing concurrency errors by setting project as a 'library'

  // Instantiate the logger with custom storage configuration.
  new Logger({
    storage: {
      formatter: (level, logData) => ({ level, data: logData }), // your custom log processing logic,
    },
  })

  await self.logger.info('info message')

  const file = '.logs/' + getLogFileName()
  const log = JSON.parse(await Deno.readTextFile(file))

  assertEquals(log[0], { level: 'info', data: ['info message'] })

  await Deno.remove(file, { recursive: true })
})

Deno.test(
  'Logger redacts sensitive data once, before it reaches even a custom formatter/storage',
  async () => {
    if (canUseZnx()) Znx.config.project = 'space'

    // A custom formatter that does no redaction of its own — if `Logger` didn't redact upstream
    // (in `#log`, before either `showMessage` or `#storage` run), this would leak `token` as-is
    // into the saved file, since a custom formatter has no obligation to redact anything itself.
    new Logger({
      storage: {
        formatter: (level, logData) => ({ level, data: logData }),
      },
    })

    await self.logger.warn('login attempt', {
      token: 'super-secret',
      headers: new Headers({ Authorization: 'Bearer super-secret' }),
    })

    const file = '.logs/' + getLogFileName()
    const log = JSON.parse(await Deno.readTextFile(file))

    assertEquals(log[0].data[1], {
      token: '[REDACTED]',
      headers: { authorization: '[REDACTED]' },
    })

    await Deno.remove(file, { recursive: true })
  },
)

Deno.test(
  'Logger#log redacts once and shares the same result with console and storage',
  async () => {
    if (canUseZnx()) Znx.config.project = 'space'

    const customFolder = '.logs/redactOncePerLog'
    await Deno.mkdir(customFolder, { recursive: true })

    // A getter fires every time its owning object is read from scratch — if console and storage
    // each redacted their own independent copy of the same raw `payload` (the bug this guards
    // against: showMessage and `#log`'s storage branch each calling the redactor separately on
    // the original, unredacted `data`), this would read `token` twice, not once. The final JSON
    // output can't tell a single pass apart from a redundant second one, because redacting an
    // already-redacted `'[REDACTED]'` string is a no-op either way — this is why the earlier
    // output-only tests above didn't catch the duplication, only a live read-count check does.
    let reads = 0
    const payload = {
      get token() {
        reads++
        return 'super-secret'
      },
    }

    let printedPayload: unknown
    const previousWarn = console.warn
    console.warn = (...args: unknown[]) => {
      printedPayload = args[2]
    }

    const logger = new Logger({
      disableGlobalAssign: true,
      storage: { save: { folder: customFolder } },
    })

    try {
      await logger.warn('checking redaction pass count', payload)
    } finally {
      console.warn = previousWarn
    }

    assertEquals(reads, 1)
    assertEquals(printedPayload, { token: '[REDACTED]' })

    const log = JSON.parse(
      await Deno.readTextFile(customFolder + '/' + getLogFileName()),
    )
    assertEquals(log[0].data[0], { token: '[REDACTED]' })

    await Deno.remove(customFolder, { recursive: true })
  },
)

Deno.test(
  "Logger#error doesn't redact twice — serializeMultipleErrors defers to #log's single pass",
  async () => {
    if (canUseZnx()) Znx.config.project = 'space'

    const customFolder = '.logs/redactErrorOnce'
    await Deno.mkdir(customFolder, { recursive: true })

    // `redactSensitiveData` calls `pattern.test(key)` once per key at every level it walks — a
    // duck-typed `RegExp` (real `RegExp`s are frozen/native, but `redactSensitiveData` only ever
    // calls `.test()` on it, so anything with that method works, injected via the same public
    // `redact.pattern` option a caller would use) lets this count exactly how many times the
    // whole object graph is walked, for one single `.error()` call. If `serializeMultipleErrors`
    // redacted the error before handing it to `#log` (the bug this guards against — `#log` then
    // redacts it *again*), this count doubles: verified directly by temporarily reverting the fix
    // and observing 18 instead of 9 for this exact error shape, not just asserted from theory.
    let testCalls = 0
    const builtin = /^token$/i
    const countingPattern = {
      test(key: string) {
        testCalls++
        return builtin.test(key)
      },
    } as unknown as RegExp

    const logger = new Logger({
      disableGlobalAssign: true,
      redact: { pattern: countingPattern },
      storage: { save: { folder: customFolder } },
    })

    await logger.error(
      'failed',
      new HttpError('BAD_GATEWAY', { meta: { token: 'secret' } }),
    )

    // One walk of { message, name, id, meta, status, stack } touches 6 keys at the top level,
    // plus 1 in `meta` and 2 in `status` — 9 total. A second, redundant pass over the same
    // (already-redacted, but structurally identical) shape would double this to 18.
    assertEquals(testCalls, 9)

    const log = JSON.parse(
      await Deno.readTextFile(customFolder + '/' + getLogFileName()),
    )
    assertEquals(log[0].data[0].meta, { token: '[REDACTED]' })

    await Deno.remove(customFolder, { recursive: true })
  },
)

Deno.test('Logger: redact:false disables redaction for info-style data and error()', async () => {
  if (canUseZnx()) Znx.config.project = 'space'

  const customFolder = '.logs/redactDisabled'
  // `cleanupExpiredLogs` skips its own `mkdir` once any log has already been written today in this
  // process (its dedup check only compares the date-based filename, not the folder) — pre-creating
  // it directly is the same workaround this file already uses elsewhere for the same reason.
  await Deno.mkdir(customFolder, { recursive: true })
  const logger = new Logger({
    disableGlobalAssign: true,
    redact: false,
    storage: { save: { folder: customFolder } },
  })

  await logger.warn('login attempt', { token: 'super-secret' })
  await logger.error(
    'failed',
    new HttpError('BAD_GATEWAY', { meta: { token: 'super-secret' } }),
  )

  const log = JSON.parse(
    await Deno.readTextFile(customFolder + '/' + getLogFileName()),
  )
  assertEquals(log[0].data[0].token, 'super-secret')
  assertEquals(log[1].data[0].meta.token, 'super-secret')

  await Deno.remove(customFolder, { recursive: true })
})

Deno.test('Logger: redact.pattern replaces the built-in credential-key pattern', async () => {
  if (canUseZnx()) Znx.config.project = 'space'

  const customFolder = '.logs/redactCustomPattern'
  await Deno.mkdir(customFolder, { recursive: true })
  const logger = new Logger({
    disableGlobalAssign: true,
    redact: { pattern: /^my-internal-secret$/i },
    storage: { save: { folder: customFolder } },
  })

  await logger.warn('login attempt', {
    token: 'kept-as-is',
    'my-internal-secret': 'hidden',
  })

  const log = JSON.parse(
    await Deno.readTextFile(customFolder + '/' + getLogFileName()),
  )
  assertEquals(log[0].data[0], {
    token: 'kept-as-is',
    'my-internal-secret': '[REDACTED]',
  })

  await Deno.remove(customFolder, { recursive: true })
})

Deno.test('Testing disable saving', async () => {
  // Instantiate the logger with custom storage configuration.
  new Logger({ storage: false })

  await Znx.logger.info('test info')

  const file = '.logs/' + getLogFileName()
  assert(!fileExists(file))

  // no save by argument
  Znx.config.project = 'space' // simulating space project to save logs

  new Logger()
  await Znx.logger.info('Some info information without saving') // Save

  assert(fileExists(file))
  await Deno.remove(file)

  await Znx.logger.info('Some info information without saving', 'noSave')

  assert(!fileExists(file))

  // simulating library project for not savings logs
  Znx.config.project = 'library'

  new Logger()
  await Znx.logger.info('Some info information without saving')

  assert(!fileExists(file))

  // an 'app' (defineZanixApp()) package gets the same treatment as 'library' — neither is
  // necessarily a deployed long-running process on its own
  Znx.config.project = 'app'

  new Logger()
  await Znx.logger.info('Some info information without saving')

  assert(!fileExists(file))
})

Deno.test('Define a save logger in file using a worker', async () => {
  if (canUseZnx()) Znx.config.project = 'space' // Necessary to avoid testing concurrency errors by setting project as a 'library'

  const file = '.logs/' + getLogFileName()
  const result: Record<string, unknown> = await new Promise((resolve) => {
    // Instantiate the logger with custom storage configuration.
    new Logger({
      storage: {
        formatter: (level, logData) => ({ level, data: logData }), // your custom log processing logic,
        save: {
          useWorker: true,
          callback: resolve,
        },
      },
    })

    self.logger.info('info message')
  })

  assertExists(result._wasWorkerThread)
  assert(fileExists(file))
  await Deno.remove(file)
})
