/**
 * Type-guard utilities for plain-object shapes — no I/O, no framework coupling, just the
 * predicate every consumer that needs to tell "a real object literal" apart from `null`, an
 * array, or a class instance would otherwise re-implement on its own.
 *
 * @module
 */

/**
 * Checks whether `value` is a real object literal: not `null`, not an array, and not a class
 * instance (`Object.getPrototypeOf(value) === Object.prototype`, so a `Date`, a Mongo `ObjectId`,
 * or any other constructed instance is rejected). This is what makes the check safe for a caller
 * that walks a value's own enumerable properties (a prop-merge, a filter sanitizer) — a `Date`
 * has plenty of those, and none of them are meant to be treated as nested filter/prop keys.
 *
 * @param value Value to check.
 * @returns `true` when `value` is a non-null, non-array, plain-prototype object.
 *
 * @category helpers
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
}
