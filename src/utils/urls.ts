/**
 * Verifies whether a given URL string is valid and can be parsed into a URL object.
 *
 * This function attempts to create a `URL` object from the provided string. If the string is a valid
 * URL, it returns the `URL` object. If the string is not a valid URL, it returns `undefined`.
 *
 * @param url - The string to be checked and parsed as a URL.
 * @returns A `URL` object if the input string is a valid URL; `undefined` if the string cannot be parsed as a URL.
 */
export function verifyUrl(url: string): URL | undefined {
  try {
    return new URL(url)
  } catch {
    return undefined
  }
}

/**
 * Checks if the provided URL is a `file:` URL.
 *
 * @param {string} url - The URL string to be checked.
 * @returns {boolean} - Returns `true` if the URL has a `file:` protocol, otherwise `false`.
 */
export function isFileUrl(url: string): boolean {
  const parsedUrl = verifyUrl(url)
  return parsedUrl?.protocol === 'file:'
}
