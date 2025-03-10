type Zanix = typeof Znx

/**
 * Adds a value to the global `Znx` namespace, making it available globally.
 * If the `Znx` namespace does not exist, it is created automatically.
 *
 * @param data - The object to be stored globally.
 */
export function setGlobalZnx(data: Partial<Zanix>) {
  if (typeof Znx === 'undefined') {
    const baseZnx: Zanix = {
      config: {},
      logger: {} as Zanix['logger'],
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
 */
export function canUseZnx(): boolean {
  return typeof Znx !== 'undefined'
}
