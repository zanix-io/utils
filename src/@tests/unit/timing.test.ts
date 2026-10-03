import { assert, assertEquals, assertInstanceOf, assertRejects } from '@std/assert'
import {
  defaultClock,
  formatDuration,
  measure,
  roundDuration,
  serverTimingHeader,
  startTimer,
} from 'utils/timing.ts'

/** A controllable clock: `tick` moves it forward. */
function fakeClock(start = 1000) {
  let now = start
  return { clock: () => now, tick: (ms: number) => void (now += ms) }
}

Deno.test('defaultClock is monotonic and moves forward', async () => {
  const first = defaultClock()
  await new Promise((resolve) => setTimeout(resolve, 5))
  assert(defaultClock() > first)
})

Deno.test('roundDuration keeps two decimals', () => {
  assertEquals(roundDuration(12.3456), 12.35)
  assertEquals(roundDuration(0.004), 0)
  assertEquals(roundDuration(5), 5)
})

Deno.test('formatDuration picks a readable unit', () => {
  assertEquals(formatDuration(0.424), '0.42ms')
  assertEquals(formatDuration(12.34), '12.3ms')
  assertEquals(formatDuration(99.96), '100ms')
  assertEquals(formatDuration(850.4), '850ms')
  assertEquals(formatDuration(1250), '1.25s')
  assertEquals(formatDuration(59_999), '60s')
  assertEquals(formatDuration(125_000), '2m 05s')
})

Deno.test('formatDuration turns a negative or non-finite value into 0ms', () => {
  assertEquals(formatDuration(-5), '0ms')
  assertEquals(formatDuration(0), '0ms')
  assertEquals(formatDuration(NaN), '0ms')
  assertEquals(formatDuration(Infinity), '0ms')
})

Deno.test('startTimer reads the elapsed time without stopping', () => {
  const { clock, tick } = fakeClock()
  const elapsed = startTimer(clock)

  tick(30)
  assertEquals(elapsed(), 30)
  tick(20)
  assertEquals(elapsed(), 50)
})

Deno.test('startTimer never reports a negative duration when the clock goes backwards', () => {
  const { clock, tick } = fakeClock()
  const elapsed = startTimer(clock)

  tick(-10)
  assertEquals(elapsed(), 0)
})

Deno.test('measure returns the result and the duration of a synchronous function', () => {
  const { clock, tick } = fakeClock()

  const measured = measure(() => {
    tick(12.345)
    return 'value'
  }, clock)

  assertEquals(measured, { result: 'value', durationMs: 12.35 })
})

Deno.test('measure covers the whole wait of an async function', async () => {
  const { clock, tick } = fakeClock()

  const pending = measure(async () => {
    await Promise.resolve()
    tick(40)
    return 7
  }, clock)

  assertInstanceOf(pending, Promise)
  assertEquals(await pending, { result: 7, durationMs: 40 })
})

Deno.test('measure lets an error propagate unchanged', async () => {
  const failure = new Error('boom')

  try {
    measure(() => {
      throw failure
    })
    assert(false, 'must throw')
  } catch (error) {
    assert(error === failure)
  }

  await assertRejects(
    () => measure(() => Promise.reject(failure)),
    Error,
    'boom',
  )
})

Deno.test('serverTimingHeader builds the W3C header value', () => {
  assertEquals(
    serverTimingHeader([
      { name: 'db', durationMs: 12.345 },
      { name: 'render', durationMs: 48, description: 'page' },
      { name: 'cache' },
    ]),
    'db;dur=12.35, render;dur=48;desc="page", cache',
  )
})

Deno.test('serverTimingHeader replaces characters a token does not allow and drops empty names', () => {
  assertEquals(
    serverTimingHeader([
      { name: 'user db', durationMs: 1 },
      { name: 'a,b;c=d', durationMs: 2 },
      { name: '', durationMs: 3 },
    ]),
    'user_db;dur=1, a_b_c_d;dur=2',
  )
})

Deno.test('serverTimingHeader escapes the description and keeps it on one line', () => {
  assertEquals(
    serverTimingHeader([{ name: 'x', description: 'say "hi" \\ now\r\nbye' }]),
    'x;desc="say \\"hi\\" \\\\ now bye"',
  )
})

Deno.test('serverTimingHeader omits a duration that is not a finite non-negative number', () => {
  assertEquals(
    serverTimingHeader([
      { name: 'a', durationMs: NaN },
      { name: 'b', durationMs: -1 },
      { name: 'c', durationMs: Infinity },
      { name: 'd', durationMs: 0 },
    ]),
    'a, b, c, d;dur=0',
  )
})

Deno.test('serverTimingHeader returns an empty string when nothing survives', () => {
  assertEquals(serverTimingHeader([]), '')
  assertEquals(serverTimingHeader([{ name: '' }]), '')
})
