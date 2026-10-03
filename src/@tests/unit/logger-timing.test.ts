import { assert, assertEquals, assertFalse, assertStrictEquals } from '@std/assert'
import { stub } from '@std/testing/mock'
import defaultLogger, { Logger } from 'modules/logger/mod.ts'
import { createClientLogger } from 'modules/logger/main.ts'
import type { DefaultFormattedLog } from 'typings/logger.ts'

// `modules/logger/mod.ts` builds the first `Logger` at import time from this repo's own
// `deno.jsonc`, whose `zanix.project` is `'library'` — and `baseSaveData` skips persistence for
// that project type. The same reset `logger.test.ts` does, so `save` runs here.
if (typeof Znx === 'undefined') Object.assign(globalThis, { Znx: { config: {} } })
Znx.config.project = 'space'

type Level = 'debug' | 'info' | 'warn' | 'error'
type ConsoleCall = unknown[]

/** Captures what the logger prints, per console method, and restores the console. */
function captureConsole() {
  const calls: Record<Level, ConsoleCall[]> = { debug: [], info: [], warn: [], error: [] }
  const stubs = (['debug', 'info', 'warn', 'error'] as const).map((method) =>
    stub(console, method, (...args: unknown[]) => void calls[method].push(args))
  )
  return { calls, restore: () => stubs.forEach((entry) => entry.restore()) }
}

/** A `Logger` whose persisted entries land in `saved`, never on disk. */
function capturingLogger() {
  const saved: DefaultFormattedLog[] = []
  const logger = new Logger({
    disableGlobalAssign: true,
    storage: {
      save: (context) => {
        saved.push(context.getFmtLog<DefaultFormattedLog>())
        return Promise.resolve()
      },
    },
  })
  return { logger, saved }
}

/** A controllable clock: `tick` moves it forward. */
function fakeClock(start = 5000) {
  let now = start
  return { clock: () => now, tick: (ms: number) => void (now += ms) }
}

/** The data object of a printed entry (`console.<level>(header, message, data)`). */
const printedData = (call: ConsoleCall) => call[2] as Record<string, unknown>

Deno.test('timer.stop logs one entry with the label, the duration and the status', () => {
  const output = captureConsole()
  const { logger, saved } = capturingLogger()
  const { clock, tick } = fakeClock()

  try {
    const timer = logger.timer('profile.load', { clock, metadata: { userId: 'u1' } })
    tick(12.3456)
    assertEquals(timer.stop(), 12.35)
  } finally {
    output.restore()
  }

  // `debug` by default: printed, never persisted.
  assertEquals(output.calls.debug.length, 1)
  assertEquals(saved, [])
  const [, message] = output.calls.debug[0]
  assertEquals(message, 'profile.load took 12.3ms')
  assertEquals(printedData(output.calls.debug[0]), {
    userId: 'u1',
    label: 'profile.load',
    durationMs: 12.35,
    status: 'ok',
  })
})

Deno.test('timer.stop logs once: a second stop returns the same duration and prints nothing', () => {
  const output = captureConsole()
  const { logger } = capturingLogger()
  const { clock, tick } = fakeClock()

  try {
    const timer = logger.timer('once', { clock })
    tick(10)
    assertEquals(timer.stop(), 10)
    tick(500)
    assertEquals(timer.stop(), 10)
  } finally {
    output.restore()
  }

  assertEquals(output.calls.debug.length, 1)
})

Deno.test('timer.elapsed reads the running time without logging or stopping', () => {
  const output = captureConsole()
  const { logger } = capturingLogger()
  const { clock, tick } = fakeClock()

  try {
    const timer = logger.timer('running', { clock })
    tick(30)
    assertEquals(timer.elapsed(), 30)
    tick(20)
    assertEquals(timer.elapsed(), 50)
    assertEquals(output.calls.debug.length, 0)
    assertEquals(timer.stop(), 50)
  } finally {
    output.restore()
  }
})

Deno.test('timer.stop merges its metadata over the timer metadata', () => {
  const output = captureConsole()
  const { logger } = capturingLogger()

  try {
    const timer = logger.timer('merge', { metadata: { a: 1, b: 1 } })
    timer.stop({ b: 2, c: 3 })
  } finally {
    output.restore()
  }

  const data = printedData(output.calls.debug[0])
  assertEquals([data.a, data.b, data.c], [1, 2, 3])
})

Deno.test('the fixed fields cannot be overridden through metadata', () => {
  const output = captureConsole()
  const { logger } = capturingLogger()
  const { clock, tick } = fakeClock()

  try {
    const timer = logger.timer('real', {
      clock,
      metadata: { durationMs: 999, label: 'spoof', status: 'error' },
    })
    tick(5)
    timer.stop({ durationMs: 111 })
  } finally {
    output.restore()
  }

  const data = printedData(output.calls.debug[0])
  assertEquals(data.durationMs, 5)
  assertEquals(data.label, 'real')
  assertEquals(data.status, 'ok')
})

Deno.test('a persisting level stores the entry with the stable fields in its data', () => {
  const output = captureConsole()
  const { logger, saved } = capturingLogger()
  const { clock, tick } = fakeClock()

  try {
    const timer = logger.timer('db.query', { clock, level: 'info' })
    tick(250)
    timer.stop()
  } finally {
    output.restore()
  }

  assertEquals(output.calls.info.length, 1)
  assertEquals(saved.length, 1)
  assertEquals(saved[0].level, 'info')
  assertEquals(saved[0].message, 'db.query took 250ms')
  assertEquals(saved[0].data, [{ label: 'db.query', durationMs: 250, status: 'ok' }])
})

Deno.test('noSave prints a measurement at a persisting level but never stores it', () => {
  const output = captureConsole()
  const { logger, saved } = capturingLogger()

  try {
    logger.timer('quiet', { level: 'warn', noSave: true }).stop()
  } finally {
    output.restore()
  }

  assertEquals(output.calls.warn.length, 1)
  assertEquals(saved, [])
})

Deno.test('high is accepted and prints through console.error like any high entry', () => {
  const output = captureConsole()
  const { logger, saved } = capturingLogger()

  try {
    logger.timer('degraded', { level: 'high' }).stop()
  } finally {
    output.restore()
  }

  assertEquals(output.calls.error.length, 1)
  assertEquals(saved.length, 1)
  assertEquals(saved[0].level, 'high')
})

Deno.test('slowThresholdMs drops what is faster and logs the rest at warn, persisted', () => {
  const output = captureConsole()
  const { logger, saved } = capturingLogger()
  const { clock, tick } = fakeClock()

  try {
    const fast = logger.timer('fast', { clock, slowThresholdMs: 100 })
    tick(99.99)
    fast.stop()
    assertEquals(output.calls.warn.length + output.calls.debug.length, 0)
    assertEquals(saved, [])

    const slow = logger.timer('slow', { clock, slowThresholdMs: 100 })
    tick(100)
    slow.stop()
  } finally {
    output.restore()
  }

  assertEquals(output.calls.warn.length, 1)
  assertEquals(saved.length, 1)
  assertEquals(saved[0].level, 'warn')
  assertEquals(saved[0].message, 'slow took 100ms')
})

Deno.test('an explicit level wins over the warn default of a slow threshold', () => {
  const output = captureConsole()
  const { logger, saved } = capturingLogger()
  const { clock, tick } = fakeClock()

  try {
    const timer = logger.timer('slow-info', { clock, slowThresholdMs: 10, level: 'info' })
    tick(50)
    timer.stop()
  } finally {
    output.restore()
  }

  assertEquals(output.calls.info.length, 1)
  assertEquals(saved[0].level, 'info')
})

Deno.test('a slowThresholdMs that is not a finite non-negative number is ignored', () => {
  const output = captureConsole()
  const { logger } = capturingLogger()

  try {
    logger.timer('nan', { slowThresholdMs: NaN }).stop()
    logger.timer('negative', { slowThresholdMs: -5 }).stop()
  } finally {
    output.restore()
  }

  // Both logged at the plain default level, neither dropped nor raised to warn.
  assertEquals(output.calls.debug.length, 2)
  assertEquals(output.calls.warn.length, 0)
})

Deno.test('time returns the result of a synchronous function and logs its duration', () => {
  const output = captureConsole()
  const { logger } = capturingLogger()
  const { clock, tick } = fakeClock()

  let result: string
  try {
    result = logger.time('sync', () => {
      tick(8)
      return 'done'
    }, { clock })
  } finally {
    output.restore()
  }

  assertEquals(result, 'done')
  assertEquals(output.calls.debug.length, 1)
  assertEquals(printedData(output.calls.debug[0]).durationMs, 8)
})

Deno.test('time keeps an async function async and covers the whole wait', async () => {
  const output = captureConsole()
  const { logger } = capturingLogger()
  const { clock, tick } = fakeClock()

  try {
    const pending = logger.time('async', async () => {
      await Promise.resolve()
      tick(75)
      return 42
    }, { clock })

    assert(pending instanceof Promise)
    assertEquals(await pending, 42)
  } finally {
    output.restore()
  }

  assertEquals(printedData(output.calls.debug[0]).durationMs, 75)
})

Deno.test('time rethrows the very same error of a synchronous failure and records it', () => {
  const output = captureConsole()
  const { logger, saved } = capturingLogger()
  const { clock, tick } = fakeClock()
  const failure = Object.assign(new TypeError('secret detail: password=hunter2'), {
    code: 'DB_DOWN',
  })

  try {
    try {
      logger.time('sync-fail', () => {
        tick(20)
        throw failure
      }, { clock })
      assert(false, 'must throw')
    } catch (error) {
      assertStrictEquals(error, failure)
    }
  } finally {
    output.restore()
  }

  // Raised from debug to warn, so it persists; only the name and code are recorded.
  assertEquals(output.calls.warn.length, 1)
  assertEquals(saved.length, 1)
  assertEquals(saved[0].message, 'sync-fail failed after 20ms')
  assertEquals(saved[0].data, [{
    errorName: 'TypeError',
    errorCode: 'DB_DOWN',
    label: 'sync-fail',
    durationMs: 20,
    status: 'error',
  }])
  assertFalse(JSON.stringify(saved).includes('hunter2'))
  assertFalse(JSON.stringify(output.calls.warn).includes('hunter2'))
})

Deno.test('time rethrows the very same rejection of an async failure and records it', async () => {
  const output = captureConsole()
  const { logger, saved } = capturingLogger()
  const { clock, tick } = fakeClock()
  const failure = new RangeError('nope')

  try {
    try {
      await logger.time('async-fail', async () => {
        await Promise.resolve()
        tick(33)
        throw failure
      }, { clock })
      assert(false, 'must reject')
    } catch (error) {
      assertStrictEquals(error, failure)
    }
  } finally {
    output.restore()
  }

  assertEquals(saved.length, 1)
  assertEquals(saved[0].data, [{
    errorName: 'RangeError',
    label: 'async-fail',
    durationMs: 33,
    status: 'error',
  }])
})

Deno.test('time does not mark the error as logged, so the caller still logs it itself', () => {
  const output = captureConsole()
  const { logger } = capturingLogger()
  const failure = new Error('later')

  try {
    try {
      logger.time('x', () => {
        throw failure
      })
    } catch { /** expected */ }
    // The error was passed to nothing that stamps it: logging it afterwards still prints it.
    logger.error('caller handles it', failure)
  } finally {
    output.restore()
  }

  assertEquals(output.calls.error.length, 1)
})

Deno.test('a failure is logged even below the slow threshold, a non-Error throw gets its type', () => {
  const output = captureConsole()
  const { logger, saved } = capturingLogger()

  try {
    try {
      logger.time('thrown-string', () => {
        // Deliberately not an `Error`: the case under test is a thrown primitive.
        // deno-lint-ignore no-throw-literal
        throw 'plain'
      }, { slowThresholdMs: 10_000 })
    } catch { /** expected */ }
  } finally {
    output.restore()
  }

  assertEquals(saved.length, 1)
  assertEquals((saved[0].data[0] as Record<string, unknown>).errorName, 'string')
})

Deno.test('a failure keeps a level above warn as configured', () => {
  const output = captureConsole()
  const { logger, saved } = capturingLogger()

  try {
    try {
      logger.time('high-fail', () => {
        throw new Error('x')
      }, { level: 'high' })
    } catch { /** expected */ }
  } finally {
    output.restore()
  }

  assertEquals(saved[0].level, 'high')
})

Deno.test('metadata is redacted by key like any logged data', () => {
  const output = captureConsole()
  const { logger, saved } = capturingLogger()

  try {
    logger.timer('login', {
      level: 'info',
      metadata: { userId: 'u1', token: 'abc123', headers: { authorization: 'Bearer x' } },
    }).stop()
  } finally {
    output.restore()
  }

  const printed = printedData(output.calls.info[0])
  assertEquals(printed.token, '[REDACTED]')
  assertEquals(printed.userId, 'u1')
  assertFalse(JSON.stringify(output.calls.info).includes('abc123'))
  assertFalse(JSON.stringify(output.calls.info).includes('Bearer x'))
  assertFalse(JSON.stringify(saved).includes('abc123'))
  assertFalse(JSON.stringify(saved).includes('Bearer x'))
})

Deno.test('a save function that throws never breaks the measured code', () => {
  const output = captureConsole()
  const logger = new Logger({
    disableGlobalAssign: true,
    storage: {
      save: () => {
        throw new Error('disk full')
      },
    },
  })

  try {
    assertEquals(logger.time('ok', () => 'fine', { level: 'info' }), 'fine')
    assert(logger.timer('stop', { level: 'info' }).stop() >= 0)
  } finally {
    output.restore()
  }
})

Deno.test('a save function that rejects is observed, not left as an unhandled rejection', async () => {
  const output = captureConsole()
  const logger = new Logger({
    disableGlobalAssign: true,
    storage: { save: () => Promise.reject(new Error('remote down')) },
  })

  try {
    logger.timer('remote', { level: 'info' }).stop()
    // An unhandled rejection would fail the test process on the next tick.
    await new Promise((resolve) => setTimeout(resolve, 10))
  } finally {
    output.restore()
  }
})

Deno.test('using a timer logs when the scope ends', () => {
  const output = captureConsole()
  const { logger } = capturingLogger()

  try {
    {
      using _timer = logger.timer('scoped')
      assertEquals(output.calls.debug.length, 0)
    }
  } finally {
    output.restore()
  }

  assertEquals(output.calls.debug.length, 1)
})

Deno.test('the default logger and the client logger expose the timing methods', () => {
  const output = captureConsole()

  try {
    assertEquals(defaultLogger.time('default', () => 1), 1)
    const client = createClientLogger(() => {})
    assertEquals(client.time('client', () => 2), 2)
    assert(client.timer('client-timer').stop() >= 0)
  } finally {
    output.restore()
  }

  assertEquals(output.calls.debug.length, 3)
})

Deno.test('the default clock produces a real, non-negative duration', async () => {
  const output = captureConsole()
  const { logger } = capturingLogger()

  try {
    const timer = logger.timer('real-clock')
    await new Promise((resolve) => setTimeout(resolve, 15))
    // Generous lower bound: timers may fire slightly early on a coarse clock.
    assert(timer.stop() >= 10)
  } finally {
    output.restore()
  }
})
