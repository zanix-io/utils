import type { ConfigFile } from 'typings/config.ts'
import type { ZanixGlobal } from 'typings/zanix.ts'

import { readConfig } from 'modules/helpers/config.ts'

/** Shape of the global `Znx` namespace. */
export type Zanix = ZanixGlobal['Znx']

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
          zanix = readConfig().zanix // resolved lazily, on first real access
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
