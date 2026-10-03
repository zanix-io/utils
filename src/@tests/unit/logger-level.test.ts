import {
  assert,
  assertAlmostEquals,
  assertEquals,
  assertFalse,
  assertStrictEquals,
} from '@std/assert'
import { stub } from '@std/testing/mock'
import defaultLogger, { Logger } from 'modules/logger/mod.ts'
import { createClientLogger } from 'modules/logger/main.ts'
import {
  DEFAULT_LOGGER_LEVEL,
  LOG_LEVEL_ENV,
  LOGGER_LEVELS,
  parseLoggerLevel,
  resolveLoggerLevel,
} from 'modules/logger/level.ts'
import type { DefaultFormattedLog, LoggerLevel, LoggerMethods } from 'typings/logger.ts'

// Same reset the other logger tests do: the first `Logger` is built at import time from this
// repo's `deno.jsonc` (`zanix.project` is `'library'`), and `baseSaveData` skips persistence for it.
if (typeof Znx === 'undefined') Object.assign(globalThis, { Znx: { config: {} } })
Znx.config.project = 'space'

type ConsoleCall = unknown[]
type ConsoleMethod = 'debug' | 'info' | 'warn' | 'error'

/** Captures what the logger prints, per console method, and restores the console. */
function captureConsole() {
  const calls: Record<ConsoleMethod, ConsoleCall[]> = { debug: [], info: [], warn: [], error: [] }
  const stubs = (['debug', 'info', 'warn', 'error'] as const).map((method) =>
    stub(console, method, (...args: unknown[]) => void calls[method].push(args))
  )
  /** Whether a printed entry is the warning about a level that is not valid. */
  const isConfigWarning = (call: ConsoleCall) => String(call[1]).startsWith('Invalid logger level')
  /** Every entry printed by the logger, whatever the console method (a config warning aside). */
  const printed = () => Object.values(calls).flat().filter((call) => !isConfigWarning(call))
  /** The warnings the package itself printed about a bad configuration: `(header, message)`. */
  const packageWarnings = () => calls.warn.filter(isConfigWarning)
  return {
    calls,
    printed,
    packageWarnings,
    restore: () => stubs.forEach((entry) => entry.restore()),
  }
}

/** A `Logger` whose persisted entries land in `saved`, never on disk. */
function capturingLogger(level?: LoggerLevel) {
  const saved: DefaultFormattedLog[] = []
  const logger = new Logger({
    disableGlobalAssign: true,
    ...(level ? { level } : {}),
    storage: {
      save: (context) => {
        saved.push(context.getFmtLog<DefaultFormattedLog>())
        return Promise.resolve()
      },
    },
  })
  return { logger, saved }
}

/** Calls the logging method named `method`, with the arguments each one takes. */
function logWith(logger: Logger, method: LoggerMethods) {
  if (method === 'success') return logger.success('done')
  return logger[method](`${method} message`)
}

/** The six methods in ascending severity. */
const METHODS: readonly LoggerMethods[] = ['debug', 'info', 'success', 'warn', 'high', 'error']
/** What each method persists by default: `debug` and `success` never do. */
const PERSISTS: ReadonlySet<LoggerMethods> = new Set(['info', 'warn', 'high', 'error'])
/** The least severe method each level still handles, as an index into METHODS (silent: none). */
const FIRST_HANDLED: Record<LoggerLevel, number> = {
  debug: 0,
  info: 1,
  warn: 3,
  high: 4,
  error: 5,
  silent: METHODS.length,
}

/** Runs `body` with `LOG_LEVEL` set (or unset with `undefined`) and restores it afterwards. */
function withEnv<T>(value: string | undefined, body: () => T): T {
  const before = Deno.env.get(LOG_LEVEL_ENV)
  if (value === undefined) Deno.env.delete(LOG_LEVEL_ENV)
  else Deno.env.set(LOG_LEVEL_ENV, value)
  try {
    return body()
  } finally {
    if (before === undefined) Deno.env.delete(LOG_LEVEL_ENV)
    else Deno.env.set(LOG_LEVEL_ENV, before)
  }
}

Deno.test('the default level handles everything, as the logger always did', () => {
  const output = captureConsole()
  try {
    withEnv(undefined, () => {
      const { logger, saved } = capturingLogger()
      assertEquals(logger.getLevel(), DEFAULT_LOGGER_LEVEL)
      assertEquals(DEFAULT_LOGGER_LEVEL, 'debug')
      for (const method of METHODS) logWith(logger, method)
      assertEquals(output.printed().length, METHODS.length)
      assertEquals(saved.map((entry) => entry.level), ['info', 'warn', 'high', 'error'])
    })
  } finally {
    output.restore()
  }
})

for (const level of LOGGER_LEVELS) {
  Deno.test(`level ${level}: prints and persists only the methods at or above it`, () => {
    const output = captureConsole()
    try {
      const { logger, saved } = capturingLogger(level)
      const handled = METHODS.slice(FIRST_HANDLED[level])

      for (const method of METHODS) logWith(logger, method)

      assertEquals(logger.getLevel(), level)
      assertEquals(output.printed().length, handled.length)
      assertEquals(saved.map((entry) => entry.level), handled.filter((m) => PERSISTS.has(m)))
      for (const method of METHODS) {
        assertEquals(logger.isLevelEnabled(method), handled.includes(method), `${level}/${method}`)
      }
    } finally {
      output.restore()
    }
  })
}

Deno.test('success ranks with info: info lets it through, warn does not', () => {
  assert(capturingLogger('info').logger.isLevelEnabled('success'))
  assertFalse(capturingLogger('warn').logger.isLevelEnabled('success'))
  assert(capturingLogger('debug').logger.isLevelEnabled('success'))
})

Deno.test('high sits between warn and error: error alone hides it, warn does not', () => {
  assert(capturingLogger('warn').logger.isLevelEnabled('high'))
  assert(capturingLogger('high').logger.isLevelEnabled('high'))
  assertFalse(capturingLogger('error').logger.isLevelEnabled('high'))
  assert(capturingLogger('error').logger.isLevelEnabled('error'))
})

Deno.test('LOG_LEVEL sets the level of a logger created without one, trimmed and any case', () => {
  const output = captureConsole()
  try {
    assertEquals(withEnv('warn', () => capturingLogger().logger.getLevel()), 'warn')
    assertEquals(withEnv('  ERROR ', () => capturingLogger().logger.getLevel()), 'error')
    assertEquals(withEnv('Silent', () => capturingLogger().logger.getLevel()), 'silent')
    assertEquals(output.packageWarnings().length, 0)
  } finally {
    output.restore()
  }
})

Deno.test('an empty or missing LOG_LEVEL is the default, with no warning', () => {
  const output = captureConsole()
  try {
    assertEquals(withEnv(undefined, () => capturingLogger().logger.getLevel()), 'debug')
    assertEquals(withEnv('', () => capturingLogger().logger.getLevel()), 'debug')
    assertEquals(withEnv('   ', () => capturingLogger().logger.getLevel()), 'debug')
    assertEquals(output.packageWarnings().length, 0)
  } finally {
    output.restore()
  }
})

Deno.test('the level option wins over LOG_LEVEL', () => {
  assertEquals(withEnv('error', () => capturingLogger('debug').logger.getLevel()), 'debug')
  assertEquals(withEnv('debug', () => capturingLogger('silent').logger.getLevel()), 'silent')
})

Deno.test('an invalid LOG_LEVEL falls back to the default and is reported once', () => {
  const output = captureConsole()
  try {
    const first = withEnv('loud-env', () => capturingLogger().logger)
    const second = withEnv('loud-env', () => capturingLogger().logger)

    assertEquals(first.getLevel(), 'debug')
    assertEquals(second.getLevel(), 'debug')
    assertEquals(output.packageWarnings().length, 1)
    const message = String(output.packageWarnings()[0][1])
    assert(message.includes('loud-env'))
    assert(message.includes(LOG_LEVEL_ENV))
    assert(message.includes(LOGGER_LEVELS.join(', ')))

    // Safe: nothing is hidden by the typo.
    logWith(first, 'debug')
    assertEquals(output.printed().length, 1)
  } finally {
    output.restore()
  }
})

Deno.test('an invalid level option is reported once and the environment decides instead', () => {
  const output = captureConsole()
  try {
    const level = withEnv(
      'warn',
      () =>
        new Logger({ disableGlobalAssign: true, level: 'loud-option' as LoggerLevel }).getLevel(),
    )
    assertEquals(level, 'warn')
    assertEquals(output.packageWarnings().length, 1)
    assert(String(output.packageWarnings()[0][1]).includes('loud-option'))
  } finally {
    output.restore()
  }
})

Deno.test('parseLoggerLevel and resolveLoggerLevel read levels without throwing', () => {
  const output = captureConsole()
  try {
    assertEquals(parseLoggerLevel(undefined, 'x'), undefined)
    assertEquals(parseLoggerLevel(null, 'x'), undefined)
    assertEquals(parseLoggerLevel('', 'x'), undefined)
    assertEquals(parseLoggerLevel(' High ', 'x'), 'high')
    assertEquals(parseLoggerLevel(42, 'x-number'), undefined)
    assertEquals(withEnv(undefined, () => resolveLoggerLevel()), 'debug')
    assertEquals(withEnv('info', () => resolveLoggerLevel()), 'info')
    assertEquals(withEnv('info', () => resolveLoggerLevel('error')), 'error')
  } finally {
    output.restore()
  }
})

Deno.test('a browser-safe client logger never reads LOG_LEVEL and takes a level option', () => {
  const output = captureConsole()
  try {
    withEnv('silent', () => {
      const client = createClientLogger(() => {})
      assertEquals(client.getLevel(), 'debug')
      client.debug('still printed')
      assertEquals(output.printed().length, 1)

      const quiet = createClientLogger(() => {}, { level: 'warn' })
      assertEquals(quiet.getLevel(), 'warn')
      quiet.info('hidden')
      quiet.warn('shown')
      assertEquals(output.printed().length, 2)
    })
  } finally {
    output.restore()
  }
})

Deno.test('setLevel changes the level at run time and only for that instance', () => {
  const output = captureConsole()
  try {
    const { logger, saved } = capturingLogger('debug')
    const other = capturingLogger('debug').logger

    logger.info('before')
    logger.setLevel('error')
    assertEquals(logger.getLevel(), 'error')
    logger.info('hidden')
    logger.warn('hidden')
    logger.error('shown')
    logger.setLevel('debug')
    logger.info('after')

    assertEquals(saved.map((entry) => entry.message), ['before', 'shown', 'after'])
    assertEquals(other.getLevel(), 'debug')
  } finally {
    output.restore()
  }
})

Deno.test('setLevel with a value that is not a level keeps the current level and reports once', () => {
  const output = captureConsole()
  try {
    const { logger } = capturingLogger('warn')
    logger.setLevel('loud-set' as LoggerLevel)
    logger.setLevel('loud-set' as LoggerLevel)
    assertEquals(logger.getLevel(), 'warn')
    assertEquals(output.packageWarnings().length, 1)
  } finally {
    output.restore()
  }
})

Deno.test('silent handles nothing, not even an error, and an error stays unmarked', () => {
  const output = captureConsole()
  try {
    const failure = new Error('boom')
    const silent = capturingLogger('silent')
    assertStrictEquals(silent.logger.error('lost', failure), undefined)
    assertEquals(output.printed().length, 0)
    assertEquals(silent.saved.length, 0)

    // The error was not marked as logged, so a logger that handles errors still logs it.
    const loud = capturingLogger('error')
    loud.logger.error('seen', failure)
    assertEquals(loud.saved.length, 1)
  } finally {
    output.restore()
  }
})

Deno.test('ingest respects the level of the relayed entry and still never prints', () => {
  const output = captureConsole()
  try {
    const { logger, saved } = capturingLogger('warn')
    logger.ingest('info', 'client', 'dropped')
    logger.ingest('warn', 'client', 'kept')
    logger.ingest('error', 'client', 'kept too')

    assertEquals(saved.map((entry) => entry.message), ['kept', 'kept too'])
    assertEquals(output.printed().length, 0)
  } finally {
    output.restore()
  }
})

Deno.test('the default logger proxy exposes the level methods', () => {
  const output = captureConsole()
  try {
    const before = defaultLogger.getLevel()
    try {
      defaultLogger.setLevel('error')
      assertEquals(defaultLogger.getLevel(), 'error')
      assertFalse(defaultLogger.isLevelEnabled('warn'))
      assert(defaultLogger.isLevelEnabled('error'))
    } finally {
      defaultLogger.setLevel(before)
    }
    assertEquals(defaultLogger.getLevel(), before)
  } finally {
    output.restore()
  }
})

/** A clock that counts how many times it was read. */
function spyClock(start = 1000) {
  let reads = 0
  let now = start
  return {
    clock: () => {
      reads++
      return now
    },
    tick: (ms: number) => void (now += ms),
    reads: () => reads,
  }
}

Deno.test('time at a level that could never be logged only runs the function: the clock is never read', async () => {
  const output = captureConsole()
  try {
    const { logger, saved } = capturingLogger('error')
    const spy = spyClock()
    const options = { clock: spy.clock, metadata: { userId: 'u1' } }

    assertEquals(logger.time('sync', () => 7, options), 7)
    assertEquals(await logger.time('async', () => Promise.resolve('ok'), options), 'ok')
    const failure = new Error('boom')
    let thrown: unknown
    try {
      logger.time('fails', () => {
        throw failure
      }, options)
    } catch (error) {
      thrown = error
    }
    assertStrictEquals(thrown, failure)
    await logger.time('rejects', () => Promise.reject(failure), options).catch((error) => {
      assertStrictEquals(error, failure)
    })

    assertEquals(spy.reads(), 0)
    assertEquals(output.printed().length, 0)
    assertEquals(saved.length, 0)
  } finally {
    output.restore()
  }
})

Deno.test('time at a disabled level still measures so a failure is logged at warn with its duration', async () => {
  const output = captureConsole()
  try {
    // `info` hides the default `debug` level of a measurement, but not the `warn` a failure becomes.
    const { logger, saved } = capturingLogger('info')
    const spy = spyClock()

    assertEquals(logger.time('fine', () => 1, { clock: spy.clock }), 1)
    assertEquals(output.printed().length, 0)
    assertEquals(saved.length, 0)
    assert(spy.reads() > 0)

    const failure = new Error('boom')
    try {
      logger.time('breaks', () => {
        spy.tick(40)
        throw failure
      }, { clock: spy.clock })
    } catch (error) {
      assertStrictEquals(error, failure)
    }
    await Promise.resolve()

    assertEquals(saved.length, 1)
    assertEquals(saved[0].level, 'warn')
    const data = saved[0].data[0] as Record<string, unknown>
    assertEquals(data.status, 'error')
    assertEquals(data.durationMs, 40)
  } finally {
    output.restore()
  }
})

Deno.test('time with a slow threshold is measured when its warn level is enabled', () => {
  const output = captureConsole()
  try {
    // At `warn` the default `debug` level of a measurement is hidden, but a threshold raises the
    // measurement to `warn`: it is measured, and only the slow ones are logged.
    const { logger, saved } = capturingLogger('warn')
    const spy = spyClock()

    logger.time('quick', () => spy.tick(5), { clock: spy.clock, slowThresholdMs: 50 })
    logger.time('slow', () => spy.tick(80), { clock: spy.clock, slowThresholdMs: 50 })

    assert(spy.reads() >= 2)
    assertEquals(saved.length, 1)
    assertEquals(saved[0].level, 'warn')
    assertEquals((saved[0].data[0] as Record<string, unknown>).label, 'slow')
  } finally {
    output.restore()
  }
})

Deno.test('time with a threshold under error never reads the clock: nothing could be logged', () => {
  const output = captureConsole()
  try {
    const { logger } = capturingLogger('error')
    const spy = spyClock()
    logger.time('slow', () => spy.tick(500), { clock: spy.clock, slowThresholdMs: 10 })
    assertEquals(spy.reads(), 0)
    assertEquals(output.printed().length, 0)
  } finally {
    output.restore()
  }
})

Deno.test('a timer that could never be logged still returns the duration, and logs nothing', () => {
  const output = captureConsole()
  try {
    const { logger, saved } = capturingLogger('silent')
    const spy = spyClock()
    const timer = logger.timer('stopwatch', { clock: spy.clock })

    spy.tick(12.3456)
    assertAlmostEquals(timer.elapsed(), 12.3456, 1e-6)
    assertEquals(timer.stop(), 12.35)
    spy.tick(100)
    assertEquals(timer.stop(), 12.35)
    timer[Symbol.dispose]()

    assertEquals(output.printed().length, 0)
    assertEquals(saved.length, 0)
  } finally {
    output.restore()
  }
})

Deno.test('time and timer log exactly as before at the default level', () => {
  const output = captureConsole()
  try {
    const { logger, saved } = capturingLogger()
    const spy = spyClock()

    logger.time('plain', () => spy.tick(3), { clock: spy.clock, level: 'info' })
    const timer = logger.timer('manual', { clock: spy.clock, level: 'warn' })
    spy.tick(4)
    timer.stop()

    assertEquals(saved.map((entry) => entry.level), ['info', 'warn'])
    assertEquals(output.printed().length, 2)
  } finally {
    output.restore()
  }
})
