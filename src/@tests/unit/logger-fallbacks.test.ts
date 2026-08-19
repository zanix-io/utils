import { assert, assertEquals, assertFalse } from '@std/assert'
import { stub } from '@std/testing/mock'
import { baseHeaderLog, buildHeaderLog } from 'modules/logger/base.ts'
import { baseFormatter } from 'modules/logger/defaults/formatter.ts'

Deno.test('baseHeaderLog omits the app name when the config file cannot be read', () => {
  const readTextFileSyncStub = stub(Deno, 'readTextFileSync', () => {
    throw new Error('boom')
  })

  let header: [string, ...string[]]
  try {
    header = baseHeaderLog('info')
  } finally {
    readTextFileSyncStub.restore()
  }

  assert(header[0].includes('ZNX-INFO'))
  assert(!header[0].includes('@zanix/utils'))
})

Deno.test('baseHeaderLog picks the terminal (ANSI) branch inside a real Deno process', () => {
  const [header, ...rest] = baseHeaderLog('info')

  // Real ANSI escape sequences, not the browser's `%c` token — `typeof Deno !== 'undefined'` here.
  assert(header.includes('\u001b['))
  assertFalse(header.includes('%c'))
  assertEquals(rest, [])
})

Deno.test('buildHeaderLog (browser variant) uses %c + a CSS string instead of ANSI escapes', () => {
  for (
    const method of ['info', 'success', 'error', 'warn', 'debug'] as const
  ) {
    const [header, style, ...rest] = buildHeaderLog(method, true)

    assert(header.startsWith('%c'))
    assertFalse(header.includes('\u001b['))
    assert(style.includes('color:'))
    assertEquals(rest, [])
  }
})

Deno.test('buildHeaderLog (browser): omits the app name when the config cannot be read', () => {
  const readTextFileSyncStub = stub(Deno, 'readTextFileSync', () => {
    throw new Error('boom')
  })

  let header: string
  try {
    ;[header] = buildHeaderLog('warn', true)
  } finally {
    readTextFileSyncStub.restore()
  }

  assert(header.includes('ZNX-WARNING'))
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
