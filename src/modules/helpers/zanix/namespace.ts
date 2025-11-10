import type { ConfigFile } from 'typings/config.ts'

import { readConfig } from 'modules/helpers/config.ts'

type Zanix = typeof Znx

/**
 * Adds a value to the global `Znx` namespace, making it available globally.
 * If the `Znx` namespace does not exist, it is created automatically.
 *
 * @param data - The object to be stored globally.
 *
 * @category helpers
 */
export function setGlobalZnx(data: Partial<Zanix>) {
  if (typeof Znx === 'undefined') {
    const config: ConfigFile = {}
    try {
      config.zanix = readConfig().zanix // initialize config data
    } catch { /** ignore error */ }

    const baseZnx: Zanix = {
      config: { ...config.zanix, ...data.config },
      logger: { ...data.logger } as Zanix['logger'],
    }
    Object.assign(globalThis, { Znx: baseZnx })
  }
  Object.assign(Znx, { ...Znx, ...data })
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
