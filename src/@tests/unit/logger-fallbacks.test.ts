import { assert, assertEquals, assertFalse } from '@std/assert'
import { stub } from '@std/testing/mock'
import * as colors from '@std/fmt/colors'
import {
  baseHeaderLog,
  buildHeaderLog,
  registerColorFormatter,
  registerConfigNameReader,
} from 'modules/logger/base.ts'
import { readConfig } from 'modules/helpers/config.ts'
import { baseFormatter } from 'modules/logger/defaults/formatter.ts'
import { getTemporaryFolder } from 'modules/helpers/paths.ts'

// `base.ts` itself never imports `@std/fmt/colors`/`readConfig` directly — only
// `modules/logger/mod.ts` wires the real implementations in, as an import-time side effect (see
// `registerColorFormatter`'s own doc in `base.ts` for why). This file exercises `base.ts` directly,
// bypassing `mod.ts` entirely, so it registers the same real implementations itself here, to keep
// testing genuine ANSI/config behavior below rather than the browser-safe no-op fallback that
// applies only when nothing has registered a real formatter/reader yet.
registerColorFormatter(colors)
registerConfigNameReader(() => readConfig().name)

// `readConfig` memoizes its result by resolved config path, module-wide — by the time this test
// runs, some earlier-loaded module has already primed that cache with this project's own real
// `deno.jsonc`. Stubbing `Deno.readTextFileSync` alone can no longer force a read failure, since a
// cache hit never reaches it; stubbing `Deno.cwd` to a directory with no config file at all makes
// the resolved path itself come up empty, which is what actually forces `readConfig` to throw
// (mirrors `config.test.ts`'s own "throws when no config file path can be resolved" case).
Deno.test('baseHeaderLog omits the app name when the config file cannot be read', async () => {
  const emptyDir = getTemporaryFolder(import.meta.url) + '/no-config-base'
  await Deno.mkdir(emptyDir, { recursive: true })
  const cwdStub = stub(Deno, 'cwd', () => emptyDir)

  let header: [string, ...string[]]
  try {
    header = baseHeaderLog('info')
  } finally {
    cwdStub.restore()
    await Deno.remove(emptyDir, { recursive: true })
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
    const method of ['info', 'success', 'error', 'high', 'warn', 'debug'] as const
  ) {
    const [header, style, ...rest] = buildHeaderLog(method, true)

    assert(header.startsWith('%c'))
    assertFalse(header.includes('\u001b['))
    assert(style.includes('color:'))
    assertEquals(rest, [])
  }
})

// See the comment on the analogous `baseHeaderLog` test above — same reasoning applies here.
Deno.test(
  'buildHeaderLog (browser): omits the app name when the config cannot be read',
  async () => {
    const emptyDir = getTemporaryFolder(import.meta.url) + '/no-config-browser'
    await Deno.mkdir(emptyDir, { recursive: true })
    const cwdStub = stub(Deno, 'cwd', () => emptyDir)

    let header: string
    try {
      ;[header] = buildHeaderLog('warn', true)
    } finally {
      cwdStub.restore()
      await Deno.remove(emptyDir, { recursive: true })
    }

    assert(header.includes('ZNX-WARNING'))
    assert(!header.includes('@zanix/utils'))
  },
)

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
