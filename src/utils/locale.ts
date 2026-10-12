/** A BCP 47 language tag as the ecosystem takes it: `es`, `es-MX`, `zh-Hant-TW`. */
const LANG_TAG = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8}){0,3}$/

/** The longest tag {@linkcode isLangTag} accepts (the BCP 47 practical bound). */
const MAX_LANG_TAG_LENGTH = 35

/**
 * Whether `value` is a language tag (BCP 47) of the shape the ecosystem uses as a catalog key, a
 * route segment or a header value: a 2-3 letter language followed by up to three subtags
 * (`es`, `es-MX`, `zh-Hant-TW`). It checks the shape, not that the language exists.
 *
 * @param value The value to test.
 * @returns `true` when `value` is a string of that shape, at most 35 characters.
 *
 * @category helpers
 */
export function isLangTag(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_LANG_TAG_LENGTH && LANG_TAG.test(value)
}

/**
 * The languages of an `Accept-Language` header, most preferred first: ordered by `q` (an entry
 * without one counts as `1`), ties kept in the order they were written. An entry that is not a
 * valid tag ({@linkcode isLangTag}), a wildcard (`*`) and an entry with `q=0` (not acceptable) are
 * left out.
 *
 * @example
 * ```ts
 * parseAcceptLanguage('es-MX,es;q=0.9,en;q=0.8') // ['es-MX', 'es', 'en']
 * parseAcceptLanguage('en;q=0.5, *, fr;q=0, es') // ['es', 'en']
 * ```
 *
 * @param header The raw header value; `null`/`undefined`/empty give `[]`.
 * @returns The tags in preference order, as they were written (case kept).
 *
 * @category helpers
 */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return []
  return header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';')
      const given = params.find((param) => param.trim().toLowerCase().startsWith('q='))
      const q = given === undefined ? 1 : Number(given.split('=')[1])
      return { tag: tag.trim(), q: Number.isFinite(q) ? q : 0, index }
    })
    .filter((entry) => entry.q > 0 && isLangTag(entry.tag))
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .map((entry) => entry.tag)
}
