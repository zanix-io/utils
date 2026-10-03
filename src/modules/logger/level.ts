import type { LoggerLevel, LoggerMethods } from 'typings/logger.ts'
import { showMessage } from './base.ts'

/**
 * The environment variable that sets the minimum level a `Logger` prints and persists:
 * `debug`, `info`, `warn`, `high`, `error` or `silent`. Read once, when a `Logger` is created
 * without an explicit `level`. A single selector: one variable decides the outcome.
 */
export const LOG_LEVEL_ENV = 'LOG_LEVEL'

/**
 * The accepted levels, from the least to the most severe. A `Logger` handles the entries whose
 * severity is at least its level, and `'silent'` is above every one of them: nothing is handled.
 */
export const LOGGER_LEVELS: readonly LoggerLevel[] = [
  'debug',
  'info',
  'warn',
  'high',
  'error',
  'silent',
]

/** The level a `Logger` uses when none is set: everything is printed, as it always was. */
export const DEFAULT_LOGGER_LEVEL: LoggerLevel = 'debug'

/**
 * Severity of each logger method. `'success'` ranks with `'info'`: a positive notice that is
 * routine, not a warning.
 */
const METHOD_RANK: Record<LoggerMethods, number> = {
  debug: 0,
  info: 1,
  success: 1,
  warn: 2,
  high: 3,
  error: 4,
}

/** The rank above every method: with it, no entry reaches the minimum. */
const SILENT_RANK = 5

/** The rank each level lets through, as a minimum. */
const LEVEL_RANK: Record<LoggerLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  high: 3,
  error: 4,
  silent: SILENT_RANK,
}

/** The rank a level lets through, as a minimum. */
export function levelRank(level: LoggerLevel): number {
  return LEVEL_RANK[level]
}

/** Whether an entry of `method` severity reaches a logger whose minimum rank is `minimumRank`. */
export function isMethodAtLevel(method: LoggerMethods, minimumRank: number): boolean {
  return METHOD_RANK[method] >= minimumRank
}

/** The values already reported as invalid, so each one is reported once per process. */
const reportedInvalid = new Set<string>()

/**
 * Turns a text into a level: trimmed and case-insensitive. Returns `undefined` for an empty or
 * missing text (nothing was configured) and also for one that is not a level; the second case is
 * reported once, with the accepted values, and the caller then uses its default.
 * @param value - The text to read (an environment value, or a level given in code).
 * @param source - Where it came from, for the message (`'LOG_LEVEL'`, `'level'`).
 */
export function parseLoggerLevel(value: unknown, source: string): LoggerLevel | undefined {
  if (value === undefined || value === null) return undefined
  const text = String(value).trim().toLowerCase()
  if (!text) return undefined

  if ((LOGGER_LEVELS as readonly string[]).includes(text)) return text as LoggerLevel

  const key = `${source}=${text}`
  if (!reportedInvalid.has(key)) {
    reportedInvalid.add(key)
    const accepted = LOGGER_LEVELS.join(', ')
    showMessage(
      'warn',
      `Invalid logger level "${text}" in ${source}: expected one of ${accepted}. ` +
        `Falling back to "${DEFAULT_LOGGER_LEVEL}" (everything is logged).`,
    )
  }
  return undefined
}

type EnvHost = {
  env?: { get(name: string): string | undefined }
  permissions?: { querySync?(descriptor: { name: 'env'; variable: string }): { state: string } }
}

/**
 * Reads {@linkcode LOG_LEVEL_ENV} without ever prompting or throwing: where there is no `Deno`
 * (a browser), the permission is not granted, or the read fails, it is as if the variable was not
 * set. The permission is queried first because reading a variable that is not granted would
 * otherwise prompt in an interactive terminal.
 */
function readLevelFromEnv(): string | undefined {
  const host = (globalThis as { Deno?: EnvHost }).Deno
  if (!host?.env) return undefined
  try {
    const query = host.permissions?.querySync?.({ name: 'env', variable: LOG_LEVEL_ENV })
    if (query?.state !== 'granted') return undefined
    return host.env.get(LOG_LEVEL_ENV)
  } catch {
    return undefined
  }
}

/**
 * The level a new `Logger` uses: the one given in code, else {@linkcode LOG_LEVEL_ENV}, else
 * {@linkcode DEFAULT_LOGGER_LEVEL}. A level that is not valid is reported once and treated as not
 * given, so a typo never hides logs and never stops the process.
 * @param explicit - The `level` option of the `Logger`, when given.
 */
export function resolveLoggerLevel(explicit?: unknown): LoggerLevel {
  return parseLoggerLevel(explicit, 'level') ??
    parseLoggerLevel(readLevelFromEnv(), LOG_LEVEL_ENV) ??
    DEFAULT_LOGGER_LEVEL
}
