/**
 * Helper function to check if a file exists
 *
 * This function requires the following permissions:
 * `allow-read`.
 */
export function fileExists(path: string): boolean {
  try {
    return Deno.statSync(path).isFile
  } catch {
    return false
  }
}

/**
 * Helper function to check if a folder exists
 *
 * This function requires the following permissions:
 * `allow-read`.
 */
export function folderExists(path: string): boolean {
  try {
    return Deno.statSync(path).isDirectory
  } catch {
    return false
  }
}
