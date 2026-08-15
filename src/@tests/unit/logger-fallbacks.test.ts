import { assert, assertEquals } from '@std/assert'
import { stub } from '@std/testing/mock'
import { baseHeaderLog } from 'modules/logger/base.ts'
import { baseFormatter } from 'modules/logger/defaults/formatter.ts'

Deno.test('baseHeaderLog omits the app name when the config file cannot be read', () => {
  const readTextFileSyncStub = stub(Deno, 'readTextFileSync', () => {
    throw new Error('boom')
  })

  let header: string
  try {
    header = baseHeaderLog('info')
  } finally {
    readTextFileSyncStub.restore()
  }

  assert(header.includes('ZNX-INFO'))
  assert(!header.includes('@zanix/utils'))
})

Deno.test('baseFormatter keeps processId null when Deno.uid throws', () => {
  const uidStub = stub(Deno, 'uid', () => {
    throw new Error('not supported')
  })

  let result
  try {
    result = baseFormatter()('info', ['message'])
  } finally {
    uidStub.restore()
  }

  assertEquals(
    (result as { context: { processId: unknown } }).context.processId,
    null,
  )
})

Deno.test('baseFormatter falls back to the default formatter when the custom one throws', () => {
  const consoleWarn = stub(console, 'warn')

  let result
  try {
    result = baseFormatter(() => {
      throw new Error('custom formatter is broken')
    })('info', ['message'])
  } finally {
    consoleWarn.restore()
  }

  assertEquals(consoleWarn.calls.length, 1)
  assertEquals((result as { message: string }).message, 'message')
})

Deno.test('baseFormatter serializes an Error passed as extra data on non-error levels', () => {
  const error = new Error('boom')
  const result = baseFormatter()('warn', [
    'Sync failed, continuing without it',
    error,
  ]) as {
    data: unknown[]
  }

  assertEquals(JSON.parse(JSON.stringify(result.data[0])), {
    name: 'Error',
    message: 'boom',
    stack: error.stack,
  })
})

Deno.test('baseFormatter leaves non-Error extra data untouched', () => {
  const result = baseFormatter()('warn', ['Cache miss', {
    key: 'user:42',
  }]) as {
    data: unknown[]
  }

  assertEquals(result.data[0], { key: 'user:42' })
})
