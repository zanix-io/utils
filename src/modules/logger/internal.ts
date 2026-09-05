import { Logger } from './main.ts'

/**
 * A minimal, browser-safe `Logger` instance for internal use by files reachable from
 * `@zanix/utils/helpers`'s own barrel (`utils/cron.ts`, `helpers/masking/hard.ts`) that only need
 * a handful of validation-diagnostic log calls. Constructed straight from `main.ts` — never
 * `modules/logger/mod.ts` — so importing this file (and, transitively, any file that imports it)
 * never reaches `mod.ts`'s own top-level `registerFileSaveFactory` call
 * (`defaults/storage/default.ts`'s `WorkerManager`), `@std/fmt/colors`, or `helpers/config.ts`'s
 * `readConfig`: the exact same "never statically import the server-only chain" guarantee
 * `createClientLogger` already relies on — see `main.ts`'s own doc, and
 * `logger-client-std-free-module-graph.test.ts` for the mechanism this leans on.
 *
 * Not exported via any `deno.jsonc` subpath — this is purely an internal implementation detail
 * other `@zanix/utils` modules reach for instead of the full `logger/mod.ts` barrel, never a
 * public API of its own.
 *
 * Degrades the same way `createClientLogger` does when no OTHER real consumer in the same process
 * has already loaded `modules/logger/mod.ts` first: no ANSI color / `[appName]` header suffix
 * (falls back to plain text), and no automatic file-based persistence (`fileSaveFactory` stays
 * unregistered, so these calls print to the console only). `disableGlobalAssign: true` — this
 * instance is never meant to become `self.logger`/`Znx.logger`, only to give these internal call
 * sites something to log through.
 */
export default new Logger({ disableGlobalAssign: true })
