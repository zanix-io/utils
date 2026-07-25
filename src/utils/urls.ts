import regex from 'utils/regex.ts'
import { getPath, interpolate, matchWholePlaceholder } from 'utils/templates.ts'

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
 * Builds a `URLSearchParams` from a plain object — the reverse direction of
 * {@link getProcessedParams}, using the same conventions so the two round-trip:
 *
 * @example For simple key-value pairs
 *
 * ```ts
 * const params = toSearchParams({ keyA: 'a', keyB: 'b' });
 * console.log(params.toString()); // 'keyA=a&keyB=b'
 * ```
 *
 * @example For array values (encoded as duplicate keys)
 *
 * ```ts
 * const params = toSearchParams({ keyA: ['a', 'b'] });
 * console.log(params.toString()); // 'keyA=a&keyA=b'
 * ```
 *
 * @example For nested objects (encoded with bracket notation)
 *
 * ```ts
 * const params = toSearchParams({ keyA: { subKeyA: 'a', subKeyB: 'b' } });
 * console.log(params.toString()); // 'keyA%5BsubKeyA%5D=a&keyA%5BsubKeyB%5D=b'
 * ```
 *
 * `null`/`undefined` values (at any depth) are skipped entirely — no key is emitted for them.
 *
 * @param {Record<string, unknown>} params - The object to convert into search parameters.
 * @returns {URLSearchParams} The resulting `URLSearchParams`.
 *
 * @category helpers
 */
export const toSearchParams = (params: Record<string, unknown>): URLSearchParams => {
  const searchParams = new URLSearchParams()

  const append = (key: string, value: unknown): void => {
    if (value === null || value === undefined) return

    if (Array.isArray(value)) {
      for (const item of value) append(key, item)
      return
    }

    if (typeof value === 'object') {
      for (const [subKey, subValue] of Object.entries(value)) {
        append(`${key}[${subKey}]`, subValue)
      }
      return
    }

    searchParams.append(key, String(value))
  }

  for (const [key, value] of Object.entries(params)) {
    append(key, value)
  }

  return searchParams
}

/**
 * Interpolates `{{field}}`/`{{nested.path}}` placeholders (see {@link interpolate}) in a URL
 * template against `record`.
 *
 * The path portion (before `?`) is interpolated like any other string. Each query-string segment
 * (`key=value`) is handled individually: if `value` is exactly one `{{field}}` placeholder, the
 * resolved value is expanded via {@link toSearchParams} — arrays become repeated `key=` pairs,
 * nested objects use bracket notation, matching the same convention {@link getProcessedParams}
 * parses back — instead of being stringified as a single comma-joined value. A segment mixing a
 * placeholder with other text (or with no placeholder at all) is substituted as a plain string,
 * same as any other field.
 *
 * @param url - The URL template, with an optional `?query=string` portion.
 * @param record - The record to resolve placeholders against.
 *
 * @category helpers
 */
export const interpolateUrl = (url: string, record: Record<string, unknown>): string => {
  const separatorIndex = url.indexOf('?')
  if (separatorIndex === -1) return interpolate(url, record)

  const path = interpolate(url.slice(0, separatorIndex), record)
  const query = url.slice(separatorIndex + 1)

  const searchParams = new URLSearchParams()

  for (const segment of query.split('&')) {
    if (!segment) continue

    const equalsIndex = segment.indexOf('=')
    const rawKey = equalsIndex === -1 ? segment : segment.slice(0, equalsIndex)
    const rawValue = equalsIndex === -1 ? '' : segment.slice(equalsIndex + 1)
    const key = interpolate(rawKey, record)

    const wholePath = matchWholePlaceholder(rawValue)
    if (wholePath !== null) {
      const resolved = getPath(record, wholePath)
      for (const [finalKey, finalValue] of toSearchParams({ [key]: resolved })) {
        searchParams.append(finalKey, finalValue)
      }
      continue
    }

    searchParams.append(key, interpolate(rawValue, record))
  }

  const queryString = searchParams.toString()
  return queryString ? `${path}?${queryString}` : path
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
  // deno-lint-ignore no-explicit-any
): PropertyDescriptor & ThisType<any> => ({
  set(value) {
    this._computedSearch = value
  },
  get() {
    if (this._computedSearch) return this._computedSearch
    this._computedSearch = getProcessedParams(searchParams)
    return this._computedSearch
  },
})
