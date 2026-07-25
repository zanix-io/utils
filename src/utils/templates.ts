// deno-lint-ignore-file no-explicit-any

const PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g
const WHOLE_PLACEHOLDER = /^\{\{\s*([\w.]+)\s*\}\}$/

/**
 * Resolves a dot-separated path (array indices included, e.g. `'items.0.name'`) against `record`.
 *
 * @category helpers
 */
export const getPath = (record: any, path: string): unknown =>
  path.split('.').reduce(
    (value, key) => (value === null || value === undefined ? undefined : value[key]),
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
export const interpolate = <T>(value: T, record: Record<string, unknown>): T => {
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
      Object.entries(value).map(([key, val]) => [key, interpolate(val, record)]),
    ) as T
  }

  return value
}
