import { join } from '@std/path'
import { assertDenoRuntime } from 'utils/runtime.ts'

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
  // Deliberately no `assertDenoRuntime` guard here — a bare `Deno.statSync` reference already
  // throws a `ReferenceError` outside a real Deno runtime (e.g. a browser/Comet bundle), which
  // this `catch` already treats the exact same way it treats a permission-denial failure: as
  // "can't confirm it exists," not a hard crash. Adding a throwing guard would only change the
  // OUTCOME (throw instead of `false`) for this one specific cause among several this function
  // already collapses into the same boolean contract — not worth the inconsistency.
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
  // Same deliberate omission as `fileExists` above — see its own comment.
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
  assertDenoRuntime('collectFiles')
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
