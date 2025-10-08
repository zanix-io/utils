import { join } from '@std/path'
import { getPathFromCurrent } from 'modules/helpers/paths.ts'
import { isFileUrl } from 'utils/urls.ts'

/**
 * Helper function to check if a file exists
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
 * Reads the contents of a `file` from a given `URL`, either from the local filesystem or over HTTP/HTTPS.
 *
 * If the URL is a `file:` URL, the function reads the file from the local filesystem.
 * Otherwise, it fetches the file via an HTTP(S) request.
 *
 * @param {string} url - The URL that points to the file's location. It can be a `file:` URL for local files or a regular URL for remote files.
 * @param {string} relativeFromPath - A relative path that should be used to locate the target file. This path is resolved based on `getPathFromCurrent` function.
 *
 * @category helpers
 */
export async function readFileFromCurrentUrl(
  url: string,
  relativeFromPath: string,
): Promise<string> {
  const currentUrl = getPathFromCurrent(url, relativeFromPath)

  if (isFileUrl(url)) return Deno.readTextFile(currentUrl)

  const response = await fetch(currentUrl)

  return response.ok ? response.text() : ''
}

/**
 * Efficiently and recursively traverses a directory tree, reading only files
 * with matching extensions, and executing a callback for each one.
 *
 * @param {string} root - Root directory to begin traversal.
 * @param {string[]} extensions - File extensions to match (e.g. ['.gql', '.graphql']).
 * @param {(path: string, content: string) => void} callback - Called for each matched file,
 *   with the file's content and full path.
 */
export function collectFiles(
  root: string,
  extensions: string[],
  callback: (path: string, content: string) => void,
) {
  const extSet = new Set(extensions) // lookup in O(1)

  const stack = [root] // manual stack for tail-call optimization

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
