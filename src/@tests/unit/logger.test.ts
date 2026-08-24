import { assert, assertEquals } from '@std/assert'
import { assertSpyCall, returnsNext, stub } from '@std/testing/mock'
import { showMessage } from 'modules/logger/base.ts'
import { baseFormatter } from 'modules/logger/defaults/formatter.ts'
import { mockWrap } from 'modules/testing/mocks.ts'
import { baseSaveData } from 'modules/logger/defaults/storage/main.ts'
import { saveDataFileFunction } from 'modules/logger/defaults/storage/default.ts'
import { getTemporaryFolder } from 'modules/helpers/paths.ts'
import { cleanupExpiredLogs, shouldBeDeleted } from 'modules/logger/defaults/storage/cleanup.ts'
import { getLogFileName } from 'modules/logger/defaults/storage/file.ts'
import { fileExists } from 'modules/helpers/files.ts'
import { getISODate } from 'utils/dates.ts'

const ZnxMock = () => {
  if (typeof Znx === 'undefined') {
    Object.assign(globalThis, { Znx: { config: {} } }) // Define Znx mock
  }
  // `modules/logger/mod.ts` creates the first `Logger` instance (and thus `Znx`) as an
  // import-time side effect, reading this repo's own real `deno.jsonc` — whose `zanix.project`
  // is `'library'`. Left as-is, `baseSaveData`'s own `project === 'library' || 'app'` guard
  // would silently no-op below, the same way `@tests/integration/logger.test.ts` resets it to
  // `'space'` before its own save-related tests for this exact reason.
  Znx.config.project = 'space'
}

Deno.test('Ensures the logger correctly outputs messages to the console', () => {
  // Data
  const dataInfo = { data: 'test-info' }
  const dataDebug = { data: 'test-debug' }
  const dataWarn = { data: 'test-warn' }
  const dataError = { data: 'test-error' }
  const dataSucess = { data: 'test-success' }

  // Mocks
  const consoleInfo = stub(console, 'info', (...[message, ...data]) => {
    assert(message.includes('🔵'))
    assert(message.includes('ZNX-INFO'))
    assertEquals(data[0], dataInfo)
  })
  const consoleDebug = stub(console, 'debug', (...[message, ...data]) => {
    assert(message.includes('⚪️'))
    assert(message.includes('ZNX-DEBUG'))
    assertEquals(data[0], dataDebug)
  })
  const consoleWarn = stub(console, 'warn', (...[message, ...data]) => {
    assert(message.includes('🟡'))
    assert(message.includes('ZNX-WARNING'))
    assertEquals(data[0], dataWarn)
  })
  const consoleError = stub(console, 'error', (...[message, ...data]) => {
    assert(message.includes('🔴'))
    assert(message.includes(`ZNX-ERROR`))
    assertEquals(data[0], dataError)
  })

  showMessage('info', dataInfo)
  showMessage('debug', dataDebug)
  showMessage('warn', dataWarn)
  showMessage('error', dataError)

  consoleInfo.restore()
  consoleDebug.restore()
  consoleWarn.restore()
  consoleError.restore()

  const consoleSuccess = stub(console, 'info', (...[message, ...data]) => {
    assert(message.includes('🟢'))
    assert(message.includes(`ZNX-OK`))
    assertEquals(data[0], dataSucess)
  })

  showMessage('success', dataSucess)
  consoleSuccess.restore()
})

Deno.test("showMessage('high', ...) prints via console.error, not console.warn", () => {
  const dataHigh = { data: 'test-high' }

  // `high` sits between `warn` and `error` visually (its own color/icon), but operationally it
  // must dispatch through `console.error` — not `console.warn` — so stderr-only log aggregators
  // still surface it. Stubbing `console.warn` to throw catches a regression that routes it there
  // instead, not just a missing/wrong icon.
  const consoleWarn = stub(console, 'warn', () => {
    throw new Error("showMessage('high', ...) must not print via console.warn")
  })
  const consoleError = stub(console, 'error', (...[message, ...data]) => {
    assert(message.includes('🟣'))
    assert(message.includes('ZNX-HIGH'))
    assertEquals(data[0], dataHigh)
  })

  showMessage('high', dataHigh)

  consoleError.restore()
  consoleWarn.restore()
})

Deno.test("showMessage prints its args as-is — redaction is each caller's own job", () => {
  const consoleWarn = stub(console, 'warn', (...[, ...data]) => {
    assertEquals(data[0], { token: 'secret' })
  })

  showMessage('warn', { token: 'secret' })

  consoleWarn.restore()
})

Deno.test('Validates the default log message formatter', () => {
  const formatter = baseFormatter()

  const formatterMock = mockWrap(formatter, {
    showMessage: () => {},
    redact: (value: unknown) => value,
    defaultFormatter: (...data: []) => {
      return {
        id: 'base Id',
        data,
      }
    },
  })

  assertEquals(
    { id: 'base Id', data: ['info', ['message']] },
    formatterMock('info', ['message']) as never,
  )
})

Deno.test('Validates the custom log message formatter', () => {
  const formatter = baseFormatter()

  const formatterMock = mockWrap(formatter, {
    formatter: (...data: []) => {
      return {
        customId: 'id',
        customData: { data },
      }
    },
  })

  assertEquals(
    {
      customData: { data: ['info', ['message']] },
      customId: 'id',
    },
    formatterMock('info', ['message']) as never,
  )
})

Deno.test(
  "saveDataFileFunction merges its SaveDataFile options into defaultSaveData's context",
  () => {
    const context = {
      // deno-lint-ignore no-explicit-any
      defaultSaveData: (_ctx?: any) => '',
    }
    const defaultSave = stub(context, 'defaultSaveData', returnsNext(['data']))

    const saveDataFileFunctionMock = mockWrap(saveDataFileFunction, context, true)

    saveDataFileFunctionMock({ folder: 'custom-folder' })({ getFmtLog: () => ({}) } as never)

    assertSpyCall(defaultSave, 0, { returned: 'data' })
    assertEquals(defaultSave.calls[0]?.args[0]?.folder, 'custom-folder')

    defaultSave.restore()
  },
)

Deno.test('Validates the custom save log', () => {
  ZnxMock()

  const context = {
    saveDataFunction: () => '',
  }
  const saveDataFunctionMocked = stub(
    context,
    'saveDataFunction',
    returnsNext(['called']),
  )
  baseSaveData(saveDataFunctionMocked, true)({} as never)

  assertSpyCall(saveDataFunctionMocked, 0, {
    returned: 'called',
  })

  saveDataFunctionMocked.restore()
})

Deno.test('Validates the custom save log error', () => {
  const errorMessage = 'An error ocurred on save'

  const consoleMock = stub(console, 'warn')

  const saveDataFunction = () => {
    throw new Error(errorMessage)
  }

  baseSaveData(saveDataFunction, true)({} as never)

  assertEquals(consoleMock.calls[0].args[2].cause.message, errorMessage)
})

Deno.test('Validates logger file default name', () => {
  const getLogFileNameMock = mockWrap(getLogFileName, {
    getISODate: () => 'date',
    logFilename: 'log',
  })
  const file = getLogFileNameMock()
  assertEquals(file, 'log-date.json')
})

Deno.test('Validates logger default file deletion', () => {
  assertEquals(
    shouldBeDeleted('log-2000-01-01.json', new Date(getISODate()).getTime(), 1),
    true,
  )
  assertEquals(
    shouldBeDeleted('log-3000-01-01.json', new Date(getISODate()).getTime(), 1),
    false,
  )
  assertEquals(
    shouldBeDeleted('log-no-match.json', new Date(getISODate()).getTime(), 1),
    true,
  ) // should be deleted, file name format no match

  const customDatenow = new Date('2025-03-09').getTime()
  assertEquals(shouldBeDeleted('log-2025-03-07.json', customDatenow, 1), true)
  assertEquals(shouldBeDeleted('log-2025-03-08.json', customDatenow, 1), true)
  assertEquals(shouldBeDeleted('log-2025-03-09.json', customDatenow, 1), false)
  assertEquals(shouldBeDeleted('log-2025-03-10.json', customDatenow, 1), false)
})

Deno.test('Ensures the default log cleanup correctly handles expired logs', async () => {
  const logsDir = getTemporaryFolder(import.meta.url) + '/logs'
  await Deno.mkdir(logsDir, { recursive: true })

  const firstFile = logsDir + '/' + 'log-no-expiration.json'
  const secondFile = logsDir + '/' + 'log-2000-01-01.json'
  await Deno.writeTextFile(firstFile, 'data-log') // file name format no match, should be delete
  await Deno.writeTextFile(secondFile, 'data-log') // expiration file, should be delete
  await cleanupExpiredLogs(logsDir, '1d')

  assert(!fileExists(firstFile))
  assert(!fileExists(secondFile))

  // no expire, current log file
  const thirdFile = logsDir + '/' + getLogFileName()
  const fourthFile = logsDir + '/' + 'log-3000-01-01.json'
  await Deno.writeTextFile(thirdFile, 'data-log')
  await Deno.writeTextFile(fourthFile, 'data-log')
  await cleanupExpiredLogs(logsDir, '1d')

  assert(fileExists(thirdFile))
  assert(fileExists(fourthFile))

  await Deno.remove(logsDir, { recursive: true })
})
