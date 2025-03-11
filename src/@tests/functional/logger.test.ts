import { assert, assertEquals, assertExists, assertMatch } from '@std/assert'
import { getLogFileName } from 'modules/logger/defaults/storage/file.ts'
import { serializeMultipleErrors } from 'modules/errors/serialize.ts'
import { fileExists } from 'modules/helpers/files.ts'
import { canUseZnx } from 'modules/helpers/zanix/namespace.ts'
import { Logger } from 'modules/logger/main.ts'
import { HttpError } from 'modules/errors/main.ts'
import { stub } from '@std/testing/mock'
import regex from 'utils/regex.ts'

// Disable logs by testing
stub(console, 'error')
stub(console, 'info')
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

    const returned = await logger.debug('test message', { data: 'data debug' })

    assertExists(returned)
    assertMatch(returned.id, regex.uuidRegex)
    assertMatch(returned.timestamp, regex.isoDatetimeRegex)
    assertEquals(returned.level, 'debug')
    assertEquals(returned.message, 'test message')
    assertEquals(returned.data, [{ data: 'data debug' }])

    const globalZnxLogger = await logger.info('info message')
    assertExists(globalZnxLogger)
    assert(!globalZnxLogger.data.length)
    assertEquals(globalZnxLogger.level, 'info')
    assertEquals(globalZnxLogger.message, 'info message')

    const globalSelfLogger = await logger.error('this is an error')
    assertExists(globalSelfLogger)
    assert(!globalSelfLogger.data.length)
    assertEquals(globalSelfLogger.level, 'error')
    assertEquals(globalSelfLogger.message, 'this is an error')

    const error = new HttpError('BAD_GATEWAY')
    const serializedErrorLog = await logger.error(
      'this is a serialized error',
      error,
    )
    assertEquals(serializedErrorLog?.data, serializeMultipleErrors([error]))
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

    const log = JSON.parse(await Deno.readTextFile(customFolder + '/' + getLogFileName()))

    assert(!self.logger)
    assert(!globalThis['logger' as never])
    assertExists(log[0].id)
    assertExists(log[0].timestamp)
    assertEquals(log[0].level, 'warn')
    assertEquals(log[0].message, 'be careful, this is a test')
    assertEquals(log[0].data[0].message, 'warning')

    assertEquals(log[1].level, 'info')
    assertEquals(log[1].message, 'this is an info test')
    assert(!log[1].data.length)

    await Deno.remove(customFolder, { recursive: true })
  },
)

Deno.test('Define a custom log formatter to modify how the logs are saved', async () => {
  if (canUseZnx()) Znx.config.project = 'app' // Necessary to avoid testing concurrency errors by setting project as a 'library'

  // Instantiate the logger with custom storage configuration.
  new Logger({
    storage: {
      formatter: (level, logData) => ({ level, data: logData }), // your custom log processing logic,
    },
  })

  await self.logger.success('success message')

  const file = '.logs/' + getLogFileName()
  const log = JSON.parse(await Deno.readTextFile(file))

  assertEquals(log[0], { level: 'success', data: ['success message'] })

  await Deno.remove(file, { recursive: true })
})

Deno.test('Testing disable saving', async () => {
  // Instantiate the logger with custom storage configuration.
  new Logger({ storage: false })

  await Znx.logger.debug('test debug')

  const file = '.logs/' + getLogFileName()
  assert(!fileExists(file))

  // no save by argument
  Znx.config.project = 'app' // simulating app project to save logs

  new Logger()
  await Znx.logger.debug('Some debug information without saving') // Save

  assert(fileExists(file))
  await Deno.remove(file)

  await Znx.logger.debug('Some debug information without saving', 'noSave')

  assert(!fileExists(file))

  // simulating library project for not savings logs
  Znx.config.project = 'library'

  new Logger()
  await Znx.logger.debug('Some debug information without saving')

  assert(!fileExists(file))
})

Deno.test('Define a save logger in file using a worker', async () => {
  if (canUseZnx()) Znx.config.project = 'app' // Necessary to avoid testing concurrency errors by setting project as a 'library'

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

    self.logger.success('success message')
  })

  assertExists(result._wasWorkerThread)
  assert(fileExists(file))
  await Deno.remove(file)
})
