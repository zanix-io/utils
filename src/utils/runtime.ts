/**
 * Whether the current process is a real Deno runtime — `false` in a browser or any other runtime
 * the global `Deno` isn't defined in (e.g. a Comet's own client-side bundle). Every
 * `@zanix/utils/helpers` export that touches `Deno.*` directly (`readConfig`, `fileExists`,
 * `getRootDir`, `interpolateEnv`, ...) is reachable from ANY consumer importing a single helper
 * from that barrel — the same "a barrel's own re-export is a graph edge regardless of what a
 * downstream consumer actually names" reasoning already confirmed for `cron.ts`'s own
 * `WorkerManager` gap — so a Comet that only ever imports one unrelated helper still has these
 * in its own module graph, even though nothing about them fails to bundle (there's no import to
 * resolve, `Deno` is a global, not a specifier).
 *
 * @category helpers
 */
export const isDenoRuntime = (): boolean => typeof Deno !== 'undefined'

/**
 * The actual throwing logic behind {@linkcode assertDenoRuntime} — split out purely so it's
 * unit-testable without needing to undefine the real `Deno` global mid-test-suite (not possible/
 * safe to do — the same reasoning `modules/logger/base.ts`'s own `buildHeaderLog`/`baseHeaderLog`
 * split already established for its own `isBrowser` branch).
 * @param fnName - The calling function's own name, embedded in the thrown message.
 * @param isDeno - Whether the current runtime is Deno — pass {@linkcode isDenoRuntime}'s real
 * result at the real call site; a test passes a literal `true`/`false` instead.
 */
export function assertRuntimeAvailable(fnName: string, isDeno: boolean): void {
  if (isDeno) return
  throw new Error(
    `[Zanix]: '${fnName}' requires a Deno runtime and cannot run outside one (e.g. a browser/Comet bundle).`,
  )
}

/**
 * Guards a Deno-only helper (filesystem, environment, working directory) against running outside
 * a real Deno runtime — call as the first line of any exported function that touches `Deno.*`
 * directly. Turns what would otherwise be a bare, unexplained `ReferenceError: Deno is not
 * defined` — the first time such a helper is actually CALLED from a browser/Comet context, not
 * when it's merely imported — into a message that actually says why.
 * @param fnName - The calling function's own name, embedded in the thrown message.
 *
 * @example
 * ```ts
 * export function getRootDir(): string {
 *   assertDenoRuntime('getRootDir')
 *   return Deno.cwd()
 * }
 * ```
 *
 * @category helpers
 */
export function assertDenoRuntime(fnName: string): void {
  assertRuntimeAvailable(fnName, isDenoRuntime())
}
