import { join } from '@std/path'

/**
 * Helper function to check if a file exists
 *
 * Returns `false` for any `Deno.statSync` failure, not only a genuinely missing file — a
 * permission denial (`Deno.errors.NotCapable`/`PermissionDenied` from a missing `--allow-read`
 * grant) is indistinguishable from "does not exist" here. A caller that needs to react
 * differently to a permission error (e.g. propagate it instead of treating the path as absent)
 * must stat the path directly rather than relying on this function's boolean result.
 *
 * This function requires the following permissions:
 * `allow-read`.
 *
 * @tags allow-read
 * @category helpers
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
 *
 * @tags allow-read
 * @category helpers
 */
export function folderExists(path: string): boolean {
  try {
    return Deno.statSync(path).isDirectory
  } catch {
    return false
  }
}

/**
 * Efficiently and recursively traverses a directory tree, reading only files
 * with matching extensions, and executing a callback for each one.
 *
 * @param {string | string[]} root - Root directory (or directories) to begin traversal from.
 * @param {string[]} extensions - File extensions to match (e.g. ['.gql', '.graphql']).
 * @param {(path: string, content: string) => void} callback - Called for each matched file,
 *   with the file's content and full path.
 */
export function collectFiles(
  root: string | string[],
  extensions: string[],
  callback: (path: string, content: string) => void,
) {
  const extSet = new Set(extensions) // lookup in O(1)

  const stack = Array.isArray(root) ? [...root] : [root] // manual stack for tail-call optimization

  while (stack.length) {
    // deno-lint-ignore no-non-null-assertion
    const currentDir = stack.pop()!
    for (const entry of Deno.readDirSync(currentDir)) {
      const fullPath = join(currentDir, entry.name)

      if (entry.isDirectory) {
        stack.push(fullPath) // defer to stack
      } else if (entry.isFile) {
        for (const ext of extSet) {
          if (entry.name.endsWith(ext)) {
            const content = Deno.readTextFileSync(fullPath)
            callback(fullPath, content)
            break // no need to check further extensions
          }
        }
      }
    }
  }
}
