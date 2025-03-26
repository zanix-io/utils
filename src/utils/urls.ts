import regex from 'utils/regex.ts'

/**
 * Verifies whether a given URL string is valid and can be parsed into a URL object.
 *
 * This function attempts to create a `URL` object from the provided string. If the string is a valid
 * URL, it returns the `URL` object. If the string is not a valid URL, it returns `undefined`.
 *
 * @param url - The string to be checked and parsed as a URL.
 * @returns A `URL` object if the input string is a valid URL; `undefined` if the string cannot be parsed as a URL.
 *
 * @category helpers
 */
export function verifyUrl(url: string): URL | undefined {
  try {
    return new URL(url)
  } catch {
    return undefined
  }
}

/**
 * Checks if the provided URL is a `file:` URL.
 *
 * @param {string} url - The URL string to be checked.
 * @returns {boolean} - Returns `true` if the URL has a `file:` protocol, otherwise `false`.
 *
 * @category helpers
 */
export function isFileUrl(url: string): boolean {
  const parsedUrl = verifyUrl(url)
  return parsedUrl?.protocol === 'file:'
}

/**
 * `URLSearchParams` processor into various structures depending on the query parameter format.
 *
 * @example For simple key-value pairs
 *
 * ```ts
 * const searchParams = new URLSearchParams('?keyA=a&keyB=b');
 * const processed = getProcessedParams(searchParams);
 * console.log(processed); // { keyA: 'a', keyB: 'b' }
 * ```
 *
 * @example For duplicate keys
 *
 * ```ts
 * const searchParams = new URLSearchParams('?keyA=a&keyA=b');
 * const processed = getProcessedParams(searchParams);
 * console.log(processed); // { keyA: ['a', 'b'] }
 * ```
 *
 * @example For nested structures
 *
 * ```ts
 * const searchParams = new URLSearchParams('keyA[subKeyA]=a&keyA[subKeyB]=b&keyB[subKeyA]=c&keyB[subKeyB]=d');
 * const processed = getProcessedParams(searchParams);
 * console.log(processed); // { keyA: { subKeyA: 'a', subKeyB: 'b' }, keyB: { subKeyA: 'c', subKeyB: 'd' } }
 * ```
 *
 * @param {URLSearchParams} searchParams - The URL search parameters to be processed.
 * @returns {Object|Array} The processed parameters in the appropriate structure (object or array).
 *
 * @category helpers
 */
export const getProcessedParams = (searchParams: URLSearchParams): object => {
  const { keyPartsRegex, keyPartsTestRegex } = regex
  // deno-lint-ignore no-explicit-any
  const processedSearch: Record<string, any> = {}
  let currentNested = processedSearch

  const hasNestedParams = searchParams.keys().some((key) => keyPartsTestRegex.test(key))

  const basicProcessor = (key: string, values: string | string[]) => {
    processedSearch[key] = values
  }

  const nestedProcessor = (key: string, values: string | string[], allValues: string[]) => {
    // deno-lint-ignore no-non-null-assertion
    const matchs = key.match(keyPartsRegex)!
    const length = matchs.length

    for (let i = 0; i < length; i++) {
      const isLast = i === length - 1
      const match = matchs[i]
      const current = currentNested[match]
      const isObject = typeof current === 'object' && !Array.isArray(current)
      currentNested[match] = isLast
        ? (isObject ? { ...current, ...allValues } : values)
        : { ...processedSearch[match], ...current }
      currentNested = currentNested[match]
    }
    currentNested = processedSearch
  }
  const processor = hasNestedParams ? nestedProcessor : basicProcessor

  const paramKeys = searchParams.keys()
  for (const key of paramKeys) {
    const allValues = searchParams.getAll(key)
    const adaptedValues = allValues.length > 1 ? allValues : allValues[0]
    processor(key, adaptedValues, allValues)
  }
  return processedSearch
}

/**
 * Returns a property descriptor for managing processed `URLSearchParams` with `get` and `set` methods for lazy-loading.
 *
 * The `get` method retrieves the processed `URLSearchParams`, while the `set` method allows modification of the search parameters.
 * The `get` method provides the processed parameters based on the query string, while the `set` method updates the `URLSearchParams` object with new values.
 *
 * This approach avoids unnecessary computation and allows for efficient access to processed parameters when needed.
 *
 * @param {URLSearchParams} searchParams - The URL search parameters to be processed.
 *
 * `URLSearchParams` are processed by `getProcessedParams` function
 */
export const searchParamsPropertyDescriptor: (
  searchParams: URLSearchParams,
  // deno-lint-ignore no-explicit-any
) => PropertyDescriptor & ThisType<any> = (
  searchParams,
) => ({
  set(value) {
    this._computedSearch = value
  },
  get() {
    if (this._computedSearch) return this._computedSearch
    this._computedSearch = getProcessedParams(searchParams)
    return this._computedSearch
  },
})
