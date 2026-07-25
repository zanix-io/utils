/**
 * Normalizes and sanitizes a route path string.
 *
 * This function trims whitespace, removes extra slashes, converts backslashes
 * to forward slashes, ensures the path starts with a single `/`, and removes
 * any trailing slash. The result is also converted to lowercase.
 *
 * @param {string} route - The raw route path to clean.
 * @returns {string} A normalized route string starting with `/`.
 *
 * @example
 * ```ts
 * cleanRoute("///folder1/folder2//file")
 * // → "/folder1/folder2/file"
 *
 * cleanRoute("  \\API\\Users\\  ")
 * // → "/api/users"
 *
 * cleanRoute("")
 * // → "/"
 * ```
 *
 * @category helpers
 */
export function cleanRoute(route: string): string {
  let result = ''
  let prevChar = ''
  route = route.trim()

  for (let i = 0; i < route.length; i++) {
    let ch = route[i]

    // Convert backslashes a slashes
    if (ch === '\\') ch = '/'

    // Skip consecutive slashes
    if (ch === '/' && prevChar === '/') continue

    // Skip whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') continue

    result += ch
    prevChar = ch
  }

  // Ensure starts with '/'
  if (result && result[0] !== '/') result = '/' + result

  // Remove trailing slash
  if (result.length > 1 && result.endsWith('/')) result = result.slice(0, -1)

  return result.toLowerCase() || '/'
}
