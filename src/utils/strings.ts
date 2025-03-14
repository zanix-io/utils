/**
 * Capitalice function
 *
 * @example
 * ```ts
 * capitalizeWords("hello world"));  // Output: "Hello world"
 * ```
 *
 * @category helpers
 */
export function capitalize(value: string): string {
  if (value.length === 0) return value

  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Capitalice words
 * @example
 * ```ts
 * capitalizeWords("hello world"));  // Output: "Hello World"
 * ```
 *
 * @category helpers
 */
export function capitalizeWords(str: string): string {
  return str
    .split(' ') // Divide la cadena en palabras
    .map((word) => capitalize(word)) // Capitaliza cada palabra
    .join(' ') // Une las palabras nuevamente con espacios
}
