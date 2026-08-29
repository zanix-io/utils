import type { ConfigFile } from 'typings/config.ts'
import type { ZanixGlobal } from 'typings/zanix.ts'

/** Shape of the global `Znx` namespace. */
export type Zanix = ZanixGlobal['Znx']

/**
 * Resolves the current project's real `deno.json(c)` (`readConfig()`, from
 * `modules/helpers/config.ts`) — defaults to a stub that always throws, deliberately: the one real
 * call site below ({@linkcode setGlobalZnx}'s own lazy `config` getter) already wraps this in a
 * `try`/`catch` that silently falls back to `{}` (the same tolerance a genuinely missing/unreadable
 * config file already requires), so an unregistered reader degrades exactly the same way a
 * config-read failure always does.
 *
 * This indirection — a module-private variable plus a registration function, instead of this file
 * importing `readConfig` from `modules/helpers/config.ts` directly — exists for the same reason
 * `modules/logger/base.ts`'s own `registerConfigNameReader` does (see its own doc): `readConfig`
 * reaches `@std/path`, and this file sits in `createClientLogger`'s own module graph
 * (`modules/logger/main.ts` imports {@linkcode setGlobalZnx} from here, unconditionally, for every
 * `Logger` instance it constructs — the browser-safe one included). A bundler resolving that graph
 * can only resolve `@std/path` to a remote `https://jsr.io/...` URL, never a local file, and cannot
 * bundle that — regardless of whether `readConfig()` is ever actually CALLED (it's already lazy,
 * deferred to the getter below; the eager problem is the static IMPORT, not the call).
 *
 * Registered from two places, not one — unlike `logger/base.ts`'s own single-barrel precedent —
 * because this file has two independent real consumers with two independent public entrypoints:
 * `modules/helpers/mod.ts` (`@zanix/utils/helpers`, used standalone, with no logger involved at
 * all) and `modules/logger/mod.ts` (`@zanix/logger`, the server barrel). Each registers the same
 * real `readConfig` as its own import-time side effect; whichever loads first wins, and either one
 * alone is enough to keep every (server) consumer's `Znx.config` working — see
 * `registerConfigReader`'s own doc for both call sites.
 */
let configReader: () => ConfigFile = () => {
  throw new Error('[Zanix]: config reader not registered')
}

/**
 * Registers the real `readConfig` as this file's config reader — called once (idempotently; a
 * second call from the other real barrel is harmless) as a module-load side effect, by BOTH
 * `modules/helpers/mod.ts` and `modules/logger/mod.ts` (the only two files allowed to import
 * `modules/helpers/config.ts`'s `readConfig` on this file's behalf). See {@linkcode configReader}'s
 * own doc for the full reasoning.
 * @param reader - `readConfig` itself (from `modules/helpers/config.ts`), imported only by the two
 * real barrels above.
 */
export function registerConfigReader(reader: () => ConfigFile): void {
  configReader = reader
}

/**
 * Adds a value to the global `Znx` namespace, making it available globally.
 * If the `Znx` namespace does not exist, it is created automatically.
 *
 * `Znx.config` resolves lazily: reading `readConfig()` (a synchronous disk read, requiring
 * `allow-read`) is deferred to the first time something actually accesses `Znx.config`, not to
 * this call. `Logger`'s own module creates a default instance on import
 * (`modules/logger/mod.ts`), so resolving `config` eagerly here would mean merely importing the
 * logger touches disk — this mirrors the same eager-config-read footgun `@zanix/asyncmq` already
 * had to fix once (`registerRabbitMQConnector`'s `readConfig()` call, made lazy for the same
 * reason). A `readConfig()` failure (missing/invalid config file) is still silently ignored, same
 * as before — `Znx.config` just falls back to `data.config` alone in that case.
 *
 * @param data - The object to be stored globally.
 *
 * @category helpers
 */
export function setGlobalZnx(data: Partial<Zanix>) {
  if (typeof Znx === 'undefined') {
    // Mutable so a `setGlobalZnx({ config: ... })` call before the first real read can still
    // override it (via the setter below) without forcing `readConfig()` to resolve early.
    let configOverride = data.config

    const baseZnx = { logger: {} as Zanix['logger'] } as Zanix

    Object.defineProperty(baseZnx, 'config', {
      configurable: true,
      enumerable: true,
      get(): ConfigFile['zanix'] {
        let zanix: ConfigFile['zanix']
        try {
          zanix = configReader().zanix // resolved lazily, on first real access
        } catch { /** ignore error */ }
        const resolved = { ...zanix, ...configOverride }
        // Self-materializes into a plain, writable property after this first real read — `Znx.config`
        // is relied on ecosystem-wide as a stable, directly-mutable object (`Znx.config.project =
        // 'space'`, throughout this package's own test suite), not a value recomputed fresh per
        // read. `resetConfig()` (`helpers/config.ts`) only clears `readConfig()`'s own cache; it
        // does NOT un-materialize an already-resolved `Znx.config` — see that function's own doc.
        Object.defineProperty(this, 'config', {
          value: resolved,
          writable: true,
          enumerable: true,
          configurable: true,
        })
        return resolved
      },
      // Lets a `setGlobalZnx({ config: ... })` call BEFORE the first real read update the
      // override without triggering one — `config` is still a getter-only accessor at that
      // point, which `Object.assign`'s own `[[Set]]` can't write to otherwise. Once materialized
      // (above), `config` is a plain writable property and this setter no longer applies — a
      // later `setGlobalZnx({ config: ... })` call replaces it directly instead, same as before.
      set(value: ConfigFile['zanix'] | undefined) {
        configOverride = value
      },
    })

    Object.assign(globalThis, { Znx: baseZnx })
  }
  // Never `{ ...Znx, ...data }` here — spreading `Znx` would read (and force-resolve) every one
  // of its own properties, including the lazy `config` getter above, defeating the laziness this
  // function exists to provide. `data`'s own keys are the only ones this call ever needs to set —
  // `data.config`, when present, still lands correctly via the setter above (or, once `config` has
  // already materialized, via a plain property overwrite).
  Object.assign(Znx, data)
}

/**
 * Checks if the global `Znx` object is defined.
 *
 * This function ensures that the `Znx` object is available in the current environment
 * before attempting to use it. It returns a boolean indicating whether `Znx` is defined
 * and accessible or not.
 *
 * @returns {boolean} - `true` if `Znx` is defined, `false` otherwise.
 *
 * @example
 * ```ts
 * if (canUseZnx()) {
 *   const myConfig = Znx.config;
 *   // Do something with myConfig
 * }
 * ```
 *
 * @category helpers
 */
export function canUseZnx(): boolean {
  return typeof Znx !== 'undefined'
}

/**
 * Retrieves the `Znx` namespace from the global scope, making it accessible throughout the application.
 * If the `Znx` namespace does not exist, it will return `undefined`.
 *
 * This function checks if the `Znx` namespace is available for use (via `canUseZnx()`), and if so, it returns the `Znx` object.
 *
 * @returns The `Znx` namespace if it is available and can be used, or `undefined` if it cannot.
 *
 * @category helpers
 */
export function getGlobalZnx(): Zanix | undefined {
  if (canUseZnx()) return Znx
}
