// deno-lint-ignore-file no-explicit-any

import { assertDenoRuntime } from 'utils/runtime.ts'
import { toSearchParams } from 'utils/urls.ts'

// Negative lookbehind excludes `{{...}}` immediately preceded by `$` — that's `${{VAR}}` syntax
// (see `interpolateEnv` below), a separate placeholder convention this pass must leave untouched.
const PLACEHOLDER = /(?<!\$)\{\{\s*([\w.]+)\s*\}\}/g
const WHOLE_PLACEHOLDER = /^\{\{\s*([\w.]+)\s*\}\}$/
const ENV_PLACEHOLDER = /\$\{\{\s*([\w]+)\s*\}\}/g

/**
 * Resolves a dot-separated path (array indices included, e.g. `'items.0.name'`) against `record`.
 *
 * @category helpers
 */
export const getPath = (record: any, path: string): unknown =>
  path.split('.').reduce(
    (
      value,
      key,
    ) => (value === null || value === undefined ? undefined : value[key]),
    record,
  )

/**
 * Returns the field path if `value` is exactly one `{{field}}` placeholder (nothing before or
 * after it), or `null` if it isn't (mixed text, multiple placeholders, or no placeholder at all).
 *
 * @category helpers
 */
export const matchWholePlaceholder = (value: string): string | null => {
  const match = value.match(WHOLE_PLACEHOLDER)
  return match ? match[1] : null
}

/**
 * Resolves `{{field}}`/`{{nested.path}}` placeholders in `value` against `record`.
 *
 * - A string whose entire content is a single placeholder (nothing before or after it, e.g.
 *   `'{{amount}}'`) resolves to the field's **real value**, of whatever type it is — a number,
 *   boolean, `Date`, nested object, array, `null`, or `undefined` — not coerced to a string. This
 *   matters when the interpolated field should carry the record's actual data type (e.g. a
 *   numeric `amount`), not a stringified copy.
 * - A string that mixes a placeholder with other text, or has more than one placeholder (e.g.
 *   `'key={{key}}'`, a URL's query string `'?value={{value}}'`, `'Bearer {{token}}'`), always
 *   substitutes each placeholder as a **string** — the result must remain one string. A
 *   placeholder resolving to `undefined`/`null` becomes `''`.
 * - Arrays and plain objects are walked recursively so nested values get the same treatment.
 * - Any other value (numbers, booleans, `null`, `undefined`, class instances) is returned as-is.
 *
 * @param value - The value to interpolate (a string, or an object/array containing strings).
 * @param record - The record to resolve placeholders against.
 *
 * @category helpers
 */
export const interpolate = <T>(
  value: T,
  record: Record<string, unknown>,
): T => {
  if (typeof value === 'string') {
    const wholePath = matchWholePlaceholder(value)
    if (wholePath !== null) {
      return getPath(record, wholePath) as T
    }

    return value.replace(PLACEHOLDER, (_match, path) => {
      const resolved = getPath(record, path)
      return resolved === null || resolved === undefined ? '' : String(resolved)
    }) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => interpolate(item, record)) as T
  }

  if (value && typeof value === 'object' && value.constructor === Object) {
    return Object.fromEntries(
      Object.entries(value).map((
        [key, val],
      ) => [key, interpolate(val, record)]),
    ) as T
  }

  return value
}

/**
 * Resolves `${{ENV_VAR}}` placeholders in `value` against the process environment (`Deno.env`).
 *
 * This is a separate convention from {@link interpolate}'s `{{field}}` — the leading `$` marks a
 * value that comes from the environment rather than from a data record, so both can appear in the
 * same string (e.g. `'Bearer ${{TOKEN}}'` alongside a `{{field}}` elsewhere) without either one
 * resolving the other's placeholders; `interpolate` explicitly skips `{{...}}` when it's preceded
 * by `$`, leaving it for this function.
 *
 * - Every placeholder is replaced with `Deno.env.get(name)`'s value. When the variable isn't set,
 *   `Deno.env.get` returns `undefined`, which is substituted as the literal text `'undefined'`
 *   (the same way a template literal stringifies `undefined`) — this never throws.
 * - Arrays and plain objects are walked recursively so nested values get the same treatment.
 * - Any other value (numbers, booleans, `null`, `undefined`, class instances) is returned as-is.
 *
 * @param value - The value to interpolate (a string, or an object/array containing strings).
 *
 * @example
 * ```ts
 * Deno.env.set('API_KEY', 'my-secret-key')
 * interpolateEnv('Bearer ${{API_KEY}}') // → 'Bearer my-secret-key'
 * interpolateEnv('Bearer ${{MISSING}}') // → 'Bearer undefined'
 * ```
 *
 * @category helpers
 */
export const interpolateEnv = <T>(value: T): T => {
  if (typeof value === 'string') {
    assertDenoRuntime('interpolateEnv')
    return value.replace(
      ENV_PLACEHOLDER,
      (_match, name) => String(Deno.env.get(name)),
    ) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => interpolateEnv(item)) as T
  }

  if (value && typeof value === 'object' && value.constructor === Object) {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, interpolateEnv(val)]),
    ) as T
  }

  return value
}

/**
 * Interpolates `{{field}}`/`{{nested.path}}` placeholders (see {@link interpolate}) in a URL
 * template against `record`.
 *
 * The path portion (before `?`) is interpolated like any other string. Each query-string segment
 * (`key=value`) is handled individually: if `value` is exactly one `{{field}}` placeholder, the
 * resolved value is expanded via {@link toSearchParams} — arrays become repeated `key=` pairs,
 * nested objects use bracket notation, the convention `getProcessedParams` parses back — instead
 * of being stringified as a single comma-joined value. A segment mixing a
 * placeholder with other text (or with no placeholder at all) is substituted as a plain string,
 * same as any other field.
 *
 * @param url - The URL template, with an optional `?query=string` portion.
 * @param record - The record to resolve placeholders against.
 *
 * @category helpers
 */
export const interpolateUrl = (
  url: string,
  record: Record<string, unknown>,
): string => {
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
      for (
        const [finalKey, finalValue] of toSearchParams({ [key]: resolved })
      ) {
        searchParams.append(finalKey, finalValue)
      }
      continue
    }

    searchParams.append(key, interpolate(rawValue, record))
  }

  const queryString = searchParams.toString()
  return queryString ? `${path}?${queryString}` : path
}
