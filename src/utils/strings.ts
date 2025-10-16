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

/**
 * Generate hash hex using Deno crypto
 * @param text
 *
 * @example
 * ```ts
 * generateHashHex("hello world"), 'SHA-512');
 * ```
 * @returns
 */
export async function generateHashHex(
  text: string,
  algorithm: AlgorithmIdentifier = 'SHA-256',
): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)

  const hashBuffer = await crypto.subtle.digest(algorithm, data)

  const hashArray = new Uint8Array(hashBuffer)

  const hashHex = Array.from(hashArray).map((byte) => byte.toString(16).padStart(2, '0')).join('')

  return hashHex
}

/**
 * Strips // line comments and /* block comments *\/ from a JSONC string.
 * This does not remove comment-like content inside string values.
 * Use with care for trusted input.
 */
export function stripComments(value: string): string {
  return value
    // Remove block comments (/* ... */)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove line comments (//...)
    .replace(/^\s*\/\/.*$/gm, '')
    // Remove trailing line comments (after code)
    .replace(/([^:]\/\/.*)/g, (_, group) => {
      return group.startsWith('"') ? group : '' // keep if inside a string
    })
}
