/**
 * A monotonic clock, in milliseconds. Only differences between two readings mean anything — the
 * origin is unspecified, and unlike `Date.now()` it never jumps when the system time is adjusted.
 */
export type DurationClock = () => number

/**
 * The default {@linkcode DurationClock}: `performance.now()` where it exists (Deno, every browser,
 * Node), `Date.now()` otherwise — the only environments without `performance` are old runtimes
 * where a wall clock is still the best available reading.
 */
export const defaultClock: DurationClock = typeof globalThis.performance?.now === 'function'
  ? () => globalThis.performance.now()
  : () => Date.now()

/**
 * Rounds a duration to two decimals (10 microseconds) — enough to tell a 0.2 ms call from a 0.4 ms
 * one, short enough to read in a log line and to keep a stored number from carrying float noise.
 * @param ms - A duration in milliseconds.
 */
export function roundDuration(ms: number): number {
  return Math.round(ms * 100) / 100
}

/**
 * Formats a duration for a human: `0.42ms`, `12.3ms`, `850ms`, `1.25s`, `2m 05s`. Under 1 ms it
 * keeps two decimals, under 100 ms one decimal, below 1 s whole milliseconds, then seconds, then
 * minutes. A negative or non-finite value (a clock that went backwards, `NaN`) formats as `0ms`
 * rather than printing nonsense.
 * @param ms - A duration in milliseconds.
 * @example
 * ```ts
 * formatDuration(12.34) // '12.3ms'
 * formatDuration(1250) // '1.25s'
 * ```
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0ms'
  if (ms < 1) return `${roundDuration(ms)}ms`
  if (ms < 100) return `${Math.round(ms * 10) / 10}ms`
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60_000) return `${Math.round(ms / 10) / 100}s`
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.round((ms - minutes * 60_000) / 1000)
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

/**
 * Starts a stopwatch and returns the function that reads it: every call gives the milliseconds
 * elapsed since this function ran, unrounded. It never stops, so it can be read as many times as
 * needed (a running total, then a final value).
 * @param clock - Where time comes from. Defaults to {@linkcode defaultClock}; a controllable one
 * makes a test exact.
 * @example
 * ```ts
 * const elapsed = startTimer()
 * await doWork()
 * console.log(`took ${formatDuration(elapsed())}`)
 * ```
 */
export function startTimer(clock: DurationClock = defaultClock): () => number {
  const start = clock()
  return () => Math.max(0, clock() - start)
}

/** What {@linkcode measure} returns: the function's own result and how long it took. */
export type Measured<T> = {
  /** Whatever the measured function returned (the resolved value when it was async). */
  result: T
  /** How long it took, in milliseconds, rounded to two decimals. */
  durationMs: number
}

/**
 * Runs `fn` and reports how long it took. Synchronous in, synchronous out; a function returning a
 * promise gives a promise of the same `{ result, durationMs }`, with the duration covering the
 * whole wait. If `fn` throws (or its promise rejects) the error propagates unchanged and no
 * duration is reported — to record a duration even for a failure, use `logger.time` (which logs it
 * and still rethrows) or a `try`/`finally` around {@linkcode startTimer}.
 * @param fn - The function to measure.
 * @param clock - Where time comes from. Defaults to {@linkcode defaultClock}.
 * @example
 * ```ts
 * const { result: user, durationMs } = await measure(() => fetchUser(id))
 * ```
 */
export function measure<T>(fn: () => Promise<T>, clock?: DurationClock): Promise<Measured<T>>
/**
 * The synchronous overload of {@linkcode measure}: a function that does not return a promise gives
 * its `{ result, durationMs }` directly.
 * @param fn - The function to measure.
 * @param clock - Where time comes from. Defaults to {@linkcode defaultClock}.
 */
export function measure<T>(fn: () => T, clock?: DurationClock): Measured<T>
export function measure<T>(
  fn: () => T | Promise<T>,
  clock: DurationClock = defaultClock,
): Measured<T> | Promise<Measured<T>> {
  const elapsed = startTimer(clock)
  const result = fn()

  if (result instanceof Promise) {
    return result.then((value) => ({ result: value, durationMs: roundDuration(elapsed()) }))
  }

  return { result, durationMs: roundDuration(elapsed()) }
}

/** One measurement of a `Server-Timing` header: see {@linkcode serverTimingHeader}. */
export type ServerTimingEntry = {
  /**
   * The metric's name — a short token such as `db` or `render`. Characters an HTTP token does not
   * allow are replaced by `_`, and an empty name is dropped.
   */
  name: string
  /** The duration in milliseconds. Omitted from the header when it is not a finite number. */
  durationMs?: number
  /** A human-readable description, sent as a quoted string. */
  description?: string
}

// RFC 9110 `token`: the characters allowed in a metric name.
const SERVER_TIMING_INVALID_TOKEN_CHARS = /[^!#$%&'*+\-.^_`|~0-9A-Za-z]/g

/**
 * Builds the value of a `Server-Timing` response header (W3C Server Timing) from a list of
 * measurements, so a browser's devtools can show where a request's time went:
 * `db;dur=12.3, render;dur=48;desc="page"`. Pure and side-effect free: setting the header on a
 * response is the caller's job. Returns an empty string when no entry survives, which a caller
 * should treat as "do not set the header".
 *
 * The header is visible to whoever can see the response, so only put durations and fixed labels in
 * it — never a value that came from a user or a secret.
 * @param entries - The measurements to report, in order.
 * @example
 * ```ts
 * headers.set('Server-Timing', serverTimingHeader([
 *   { name: 'db', durationMs: 12.34 },
 *   { name: 'render', durationMs: 48, description: 'page' },
 * ]))
 * ```
 */
export function serverTimingHeader(entries: readonly ServerTimingEntry[]): string {
  const metrics: string[] = []

  for (const { name, durationMs, description } of entries) {
    const token = name.replace(SERVER_TIMING_INVALID_TOKEN_CHARS, '_')
    if (!token) continue

    let metric = token
    if (typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs >= 0) {
      metric += `;dur=${roundDuration(durationMs)}`
    }
    if (description) {
      metric += `;desc="${description.replace(/["\\]/g, '\\$&').replace(/[\r\n]+/g, ' ')}"`
    }
    metrics.push(metric)
  }

  return metrics.join(', ')
}
