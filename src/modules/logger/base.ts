import type { LoggerMethods } from 'typings/logger.ts'

import { getLocalTime } from 'utils/dates.ts'
import { capitalize } from 'utils/encoders.ts'

// `typeof import(...)` is a pure type query — erased entirely at emit time, so it never becomes a
// real `import` statement a bundler has to resolve. That distinction matters here specifically:
// see {@linkcode registerColorFormatter}'s own doc for why a real, static import of
// `@std/fmt/colors` in this file is incompatible with `createClientLogger`'s browser bundle, even
// though the color-formatting call site itself is already runtime-conditional (`buildHeaderLog`'s
// own `isBrowser` branch) — an eager IMPORT is the problem a bundler can't work around, not an
// eager USE.
type ColorsModule = typeof import('@std/fmt/colors')

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
 * Fallback used only when {@linkcode registerColorFormatter} was never called — i.e. this file's
 * own terminal branch (`typeof Deno !== 'undefined'` in {@linkcode baseHeaderLog}) is reached
 * without `modules/logger/mod.ts` having run first. That only happens via `createClientLogger`
 * (`@zanix/logger/client`'s own entrypoint, `main.ts`) invoked directly under Deno rather than a
 * real browser — every genuine SERVER `Logger` always loads `mod.ts` first (the same guarantee
 * `registerFileSaveFactory`'s own doc relies on), so this fallback never applies there. Passes
 * every string through unchanged instead of throwing, so a header still prints — just without ANSI
 * color — rather than losing the whole log line over an unregistered formatter.
 */
const identityColorFormatter: ColorsModule = new Proxy({} as ColorsModule, {
  get: () => (str: string) => str,
})

let colorFormatter: ColorsModule = identityColorFormatter

/**
 * Registers the real `@std/fmt/colors` module as this file's color formatter — called once, as a
 * module-load side effect, by `modules/logger/mod.ts` (the only file allowed to import
 * `@std/fmt/colors` directly). This is what lets `base.ts` keep its existing real ANSI-colored
 * output for every server consumer without ITSELF ever statically importing `@std/fmt/colors` —
 * mirrors `main.ts`'s own `registerFileSaveFactory`/`fileSaveFactory` indirection exactly, for the
 * exact same reason: a bundler resolving `createClientLogger`'s own module graph (which reaches
 * this file through `main.ts`'s `showMessage` import) can only resolve a Deno-standard-library
 * specifier like `@std/fmt/colors` to a remote `https://jsr.io/...` URL, never a local file — and
 * cannot bundle that, regardless of whether the import is actually reachable at runtime (confirmed
 * empirically, the same way `registerFileSaveFactory`'s own doc already confirmed it for a dynamic
 * `import()` of `WorkerManager`).
 * @param formatter - `@std/fmt/colors` itself, imported only by `mod.ts`.
 */
export function registerColorFormatter(formatter: ColorsModule): void {
  colorFormatter = formatter
}

/**
 * Resolves the current project's own `name` (from its `deno.json(c)`) for the header's `appName`
 * suffix — e.g. `ZNX-INFO [@my-app]:`. Defaults to a stub that always throws, deliberately: both
 * call sites below already wrap this in a `try`/`catch` that falls back to an empty `appName` (the
 * same tolerance a genuinely missing/unreadable config file already requires), so an unregistered
 * reader degrades exactly the same way a config-read failure always does, without needing its own
 * separate `if (!configNameReader)` branch.
 */
let configNameReader: () => string | undefined = () => {
  throw new Error('[Logger]: config name reader not registered')
}

/**
 * Registers the real config-name reader — called once, as a module-load side effect, by
 * `modules/logger/mod.ts` (the only file allowed to import `modules/helpers/config.ts`'s
 * `readConfig`, which itself reaches `@std/path`). Same indirection, same reasoning, and the same
 * precedent as {@linkcode registerColorFormatter} just above — this file must never statically
 * import `modules/helpers/config.ts` either, or `createClientLogger`'s own browser bundle fails
 * the exact same way over `@std/path` instead of `@std/fmt/colors`.
 * @param reader - Returns `readConfig().name`, wired up by `mod.ts`.
 */
export function registerConfigNameReader(reader: () => string | undefined): void {
  configNameReader = reader
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
      appName = ` [${configNameReader()}]`
    } catch { /** ignore error */ }

    return [
      `%c${icon} ${getLocalTime()} | ZNX-${text}${appName}:`,
      `color: ${cssColorByChalkColor[color]}; font-weight: bold;`,
    ]
  }

  let appName
  try {
    appName = colorFormatter[color](`[${configNameReader()}]`)
    appName = ` ${appName}`
  } catch {
    appName = ''
  }

  const typeFn = colorFormatter[
    `bg${capitalize(color)}` as never
  ] as (str: string) => string

  return [
    colorFormatter.bold(
      `${icon} ${colorFormatter.gray(getLocalTime())} | ${typeFn(` ZNX-${text} `)}${appName}:`,
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
