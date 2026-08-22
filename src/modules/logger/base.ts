import type { LoggerMethods } from 'typings/logger.ts'

import * as colors from '@std/fmt/colors'
import { getLocalTime } from 'utils/dates.ts'
import { capitalize } from 'utils/encoders.ts'
import { readConfig } from 'modules/helpers/config.ts'

type ChalkColors = 'blue' | 'green' | 'red' | 'magenta' | 'yellow' | 'white'

const logMethodInfo: Record<
  LoggerMethods,
  { color: ChalkColors; icon: string; text: string }
> = {
  info: { color: 'blue', icon: '🔵', text: 'INFO' },
  success: { color: 'green', icon: '🟢', text: 'OK' },
  error: { color: 'red', icon: '🔴', text: 'ERROR' },
  // Deliberately not yellow (shared with `warn`) or red (shared with `error`) — `high` needs its
  // own color so it reads as its own severity tier at a glance, not a shade of one of its
  // neighbors. `magenta` is part of the standard 16-color ANSI palette (unlike a true orange,
  // which needs 256-color/truecolor support `@std/fmt/colors`' plain color functions don't
  // guarantee), so it renders identically across terminals.
  high: { color: 'magenta', icon: '🟣', text: 'HIGH' },
  warn: { color: 'yellow', icon: '🟡', text: 'WARNING' },
  debug: { color: 'white', icon: '⚪️', text: 'DEBUG' },
}

// CSS equivalents of `ChalkColors`, for the browser devtools' own `%c` styling below — tuned for
// readability on a typical (light) devtools background rather than an exact hue match to the ANSI
// palette above (a literal `yellow`/`white` reads as barely-visible there).
const cssColorByChalkColor: Record<ChalkColors, string> = {
  blue: '#2563eb',
  green: '#16a34a',
  red: '#dc2626',
  magenta: '#a21caf',
  yellow: '#b45309',
  white: '#6b7280',
}

/**
 * Builds the formatted header `console[method]` receives as its own leading argument(s) — a
 * single ANSI-colored string in Deno/a terminal (`@std/fmt/colors`, unchanged from before), or a
 * `['%c...', cssString]` pair in a browser. A browser console doesn't interpret ANSI escape codes
 * at all — they print as raw control-sequence bytes rather than color — so reusing the terminal
 * string there would be a real formatting regression, not just a missed enhancement. `%c` + a CSS
 * string is the browser devtools' own equivalent: it styles everything in the string that follows
 * it, consumed positionally the same way `%s`/`%d` are.
 *
 * Exported separately from {@linkcode baseHeaderLog} — which is the one real call site deciding
 * `isBrowser` from `typeof Deno` — purely so both branches stay unit-testable without needing to
 * undefine the real `Deno` global from a Deno test process (not possible/safe to do mid-suite).
 *
 * @param method - {@link LoggerMethods}
 * @param isBrowser - Builds the browser (`%c`) variant instead of the terminal one when `true`.
 */
export function buildHeaderLog(
  method: LoggerMethods,
  isBrowser: boolean,
): [string, ...string[]] {
  const { color, icon, text } = logMethodInfo[method]

  if (isBrowser) {
    let appName = ''
    try {
      appName = ` [${readConfig().name}]`
    } catch { /** ignore error */ }

    return [
      `%c${icon} ${getLocalTime()} | ZNX-${text}${appName}:`,
      `color: ${cssColorByChalkColor[color]}; font-weight: bold;`,
    ]
  }

  let appName
  try {
    appName = colors[color](`[${readConfig().name}]`)
    appName = ` ${appName}`
  } catch {
    appName = ''
  }

  const typeFn = colors[
    `bg${capitalize(color)}` as never
  ] as (str: string) => string

  return [
    colors.bold(
      `${icon} ${colors.gray(getLocalTime())} | ${typeFn(` ZNX-${text} `)}${appName}:`,
    ),
  ]
}

/**
 * @param method - {@link LoggerMethods}
 */
export const baseHeaderLog = (method: LoggerMethods): [string, ...string[]] =>
  buildHeaderLog(method, typeof Deno === 'undefined')

/**
 * A pure console formatter/dispatcher — it does NOT redact. Every caller (`Logger#log`, and each
 * `showMessage('warn', ...)` fallback elsewhere in this module for a failed custom formatter/save
 * function) is responsible for redacting its own `args` exactly once, itself, before calling this —
 * see each caller's own doc for where that happens. Redacting here too, on top of that, would mean
 * paying the cost of walking the same data twice for a single console write, for no benefit: the
 * data is already safe by the time it reaches this function.
 *
 * @param method - {@link LoggerMethods}
 * @param args - The logger args, already redacted by the caller
 */
export const showMessage = (method: LoggerMethods, ...args: unknown[]) => {
  // `success` prints via `console.info` (no `console.success` exists); `high` prints via
  // `console.error` — not `console.warn` — so log aggregators that only elevate stderr-level
  // output (many do) actually surface it, matching `high`'s "needs attention soon" severity
  // rather than treating it as routine `warn` noise.
  const logMethod = method === 'success' ? 'info' : method === 'high' ? 'error' : method

  // deno-lint-ignore deno-zanix-plugin/no-znx-console
  console[logMethod](...baseHeaderLog(method), ...args)
}
