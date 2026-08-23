/**
 * Normalizes a route path string's structure.
 *
 * This function trims whitespace, removes extra slashes, converts backslashes
 * to forward slashes, ensures the path starts with a single `/`, and removes
 * any trailing slash. The result is also converted to lowercase.
 *
 * This is structural normalization only — it provides no protection against path
 * traversal (`../`), null bytes, or any other injection-shaped input. Callers that use
 * an extracted route param to touch a filesystem, database, or shell must apply their
 * own confinement/sanitization at the point of use (e.g. `confinePath` for filesystem
 * paths) rather than relying on this function for that.
 *
 * @param {string} route - The raw route path to clean.
 * @param {string} keepCase - Whether to preserve the original letter casing. If false, the route is normalized to lowercase.
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
 * cleanRoute("  \\API\\Users\\  ", true)
 * // → "/API/Users"
 *
 * cleanRoute("")
 * // → "/"
 * ```
 *
 * @category helpers
 */
export function cleanRoute(route: string, keepCase?: boolean): string {
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

  if (!result) return '/'

  return keepCase ? result : result.toLowerCase()
}
