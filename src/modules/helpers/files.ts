/**
 * Helper function to check if a file exists
 *
 * This function requires the following permissions:
 * `allow-read`.
 */
export function fileExists(path: string): boolean {
  try {
    Deno.statSync(path)
    return true
  } catch {
    return false
  }
}
