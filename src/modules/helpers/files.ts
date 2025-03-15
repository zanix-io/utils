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
