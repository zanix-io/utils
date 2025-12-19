/**
 * Shared instance of `TextEncoder`.
 *
 * Used to convert strings into `Uint8Array`
 * using UTF-8 encoding.
 *
 * @example
 * const bytes = encoder.encode('hello');
 */
export const encoder: TextEncoder = new TextEncoder()

/**
 * Shared instance of `TextDecoder`.
 *
 * Used to convert `Uint8Array` or `ArrayBuffer`
 * into strings using UTF-8 encoding.
 *
 * @example
 * const text = decoder.decode(bytes);
 */
export const decoder: TextDecoder = new TextDecoder()

/**
 * Capitalice function
 *
 * @param value
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
 *
 * @param str
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
 * Strips // line comments and /* block comments *\/ from a JSONC string.
 * This does not remove comment-like content inside string values.
 * Use with care for trusted input.
 * @param value
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

/**
 * Function to convert string to Uint8Array
 * @param {string} value
 *
 * @returns {Uint8Array<ArrayBuffer>} - string encoded
 */
export function stringToUint8Array(
  value: string,
): Uint8Array<ArrayBuffer> {
  return encoder.encode(value)
}

/**
 * Function to convert Uint8Array to string
 * @param value
 *
 * @returns {string} - Uint8Array decoded
 */
export function uint8ArrayToString(
  value: Uint8Array<ArrayBuffer | ArrayBufferLike>,
  encode = 'utf-8',
): string {
  const decoder = new TextDecoder(encode)
  return decoder.decode(value)
}

/**
 * Function to convert uint8Array to string base64
 * @param uint8Array
 * @returns {string} - uint8Array encoded
 */
export function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binaryString = ''
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i])
  }
  return btoa(binaryString)
}

/**
 * Function to convert uint8Array to HEX
 * @param uint8Array
 * @returns - uint8Array encoded
 */
export function uint8ArrayToHEX(uint8Array: Uint8Array): string {
  return [...uint8Array].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Convert a hexadecimal string to a Uint8Array.
 *
 * @param {string} hex - The hex string to be converted.
 * @returns {Uint8Array} The resulting Uint8Array.
 */
export function hexToUint8Array(hex: string): Uint8Array {
  // Remove any spaces, if present, and ensure the hex string is even length
  hex = hex.replace(/\s+/g, '').toLowerCase()

  // Check for invalid length (it should always be even)
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have an even length')
  }

  // Convert hex to Uint8Array
  const length = hex.length / 2
  const result = new Uint8Array(length)

  for (let i = 0; i < length; i++) {
    result[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }

  return result
}

/**
 * Function to convert string base64 to uint8Array
 * @param {string} base64
 * @returns {Uint8Array<ArrayBuffer>} - string base64 encoded
 */
export function base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const binaryString = atob(base64) // Decode Base64 to binary string
  const uint8Array = new Uint8Array(binaryString.length)

  // Fill the Uint8Array with the byte values from the binary string
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i)
  }

  return uint8Array
}

/**
 * Encodes a string or Uint8Array into a Base64 URL-safe format.
 *
 * This function performs the standard Base64 encoding but replaces the characters `+` with `-`,
 * `/` with `_`, and removes any trailing `=` padding to make the encoded string URL-safe.
 * This format is commonly used in JSON Web Tokens (JWT) and other URL-related encodings.
 *
 * @param {string | Uint8Array} input - The input to encode. Can be a regular string or a Uint8Array.
 * @returns {string} The Base64 URL-safe encoded string.
 *
 * @example
 * const encoded = base64UrlEncode('Hello, World!');
 * console.log(encoded); // Output: 'SGVsbG8sIFdvcmxkIQ'
 *
 * @example
 * const byteArray = new TextEncoder().encode('Hello, World!');
 * const encodedBytes = base64UrlEncode(byteArray);
 * console.log(encodedBytes); // Output: 'SGVsbG8sIFdvcmxkIQ'
 */
export const base64UrlEncode = (input: string | Uint8Array): string => {
  const base64 = btoa(input instanceof Uint8Array ? String.fromCharCode(...input) : input)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Decodes a Base64 URL-safe encoded string into a `Uint8Array`.
 *
 * This function takes a Base64 URL-safe encoded string and decodes the string back to its original
 * byte representation in a `Uint8Array`.
 *
 * @param {string} input - The Base64 URL-safe encoded string to decode.
 * @param {string} toString - If `true`, the function will ensure that the input is converted to a string.
 *                            If `false`, the function will return a `Uint8Array` by default.
 *                            This flag is used to control the conversion behavior of the input.
 * @returns {Uint8Array | string} A `Uint8Array` or a `string` containing the decoded byte data.
 *
 * @example
 * const encoded = 'SGVsbG8sIFdvcmxkIQ'; // Base64 URL-safe encoded "Hello, World!"
 * const decoded = base64UrlDecode(encoded);
 * console.log(decoded); // Output: Uint8Array with the bytes of "Hello, World!"
 */
export const base64UrlDecode = <S extends boolean = false>(
  input: string,
  toString: S = false as S,
): false extends S ? Uint8Array<ArrayBuffer> : string => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4))
  const decoded = atob(base64 + padding)
  const byteArray = new Uint8Array(decoded.length)
  for (let i = 0; i < decoded.length; i++) {
    byteArray[i] = decoded.charCodeAt(i)
  }
  return (toString ? uint8ArrayToString(byteArray) : byteArray) as never
}

/** Check if is valid ZanixHex */
export const isZanixHex: (str: string) => boolean = (str: string) => /^Zx[0-9a-fA-F]+$/.test(str)

/**
 * Compare two Uint8Array objects for equality.
 *
 * @param a - The first Uint8Array to compare.
 * @param b - The second Uint8Array to compare.
 * @returns `true` if the arrays are equal, otherwise `false`.
 */
export const compareUint8Arrays = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}
