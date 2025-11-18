import { HttpError } from 'modules/errors/main.ts'
import { stub } from '@std/testing/mock'
import { Logger } from 'modules/logger/main.ts'
import { assertThrows } from '@std/assert/assert-throws'
import { getLogFileName } from 'modules/logger/defaults/storage/file.ts'
import { assertEquals } from '@std/assert/assert-equals'
import { assert } from '@std/assert'
import { isUUID } from 'modules/validations/decorators/strings/is-uuid.ts'
import { InternalError } from '@zanix/utils/errors'

// Disable logs by testing
stub(console, 'error')

Deno.test('Validates throwing error and log', async () => {
  const folder = '.logs/errorLogs'
  new Logger({ storage: { save: { folder } } }) // generate a new logger instance for avoid testing errors by concurrency

  assertThrows(() => {
    throw new HttpError('INTERNAL_SERVER_ERROR', {
      message: 'aygono',
      shouldLog: true,
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

Deno.test('Validate error id generation and no undefined values', () => {
  const error = new HttpError('CONFLICT')
  assert(isUUID(error.id))
  assertEquals(Object.keys(error), ['message', 'name', 'id', 'status'])

  const internal = new InternalError('CONFLICT')
  assert(isUUID(internal.id))
  assertEquals(Object.keys(internal), ['message', 'name', 'id'])

  const customId = new InternalError('message', { id: 'my error id' })
  assertEquals(customId.id, 'my error id')

  const customHttpId = new HttpError('BAD_GATEWAY', { id: 'my error id' })
  assertEquals(customHttpId.id, 'my error id')
})
