import { HttpError } from 'modules/errors/main.ts'
import { stub } from '@std/testing/mock'
import { Logger } from 'modules/logger/main.ts'
import { assertThrows } from '@std/assert/assert-throws'
import { getLogFileName } from 'modules/logger/defaults/storage/file.ts'
import { assertEquals } from '@std/assert/assert-equals'

// Disable logs by testing
stub(console, 'error')

Deno.test('Validates throwing error and log', async () => {
  const folder = '.logs/errorLogs'
  new Logger({ storage: { save: { folder } } }) // generate a new logger instance for avoid testing errors by concurrency

  assertThrows(() => {
    throw new HttpError('INTERNAL_SERVER_ERROR', {
      message: 'aygono',
      log: true,
      id: 'error-context-id',
      cause: new Error('cause'),
    })
  })

  await new Promise((resolve) => setTimeout(resolve, 500)) // wait until file creation

  const log = JSON.parse(await Deno.readTextFile(folder + '/' + getLogFileName()))[0]

  assertEquals(log.level, 'error')
  assertEquals(log.message, 'aygono')
  assertEquals(log.data[0].id, 'error-context-id')
  assertEquals(log.data[0].name, 'HttpError')
  assertEquals(log.data[0].cause.name, 'Error')
  assertEquals(log.data[0].cause.message, 'cause')
  await Deno.remove(folder, { recursive: true })
})
