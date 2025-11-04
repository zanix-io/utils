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
 * @param value
 * Strips // line comments and /* block comments *\/ from a JSONC string.
 * This does not remove comment-like content inside string values.
 * Use with care for trusted input.
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
 * @param value
 *
 * @returns {Uint8Array<ArrayBuffer>} - string encoded
 */
export function stringToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder()
  return encoder.encode(value)
}

/**
 * Function to convert Uint8Array to string
 * @param value
 *
 * @returns {string} - Uint8Array decoded
 */
export function uint8ArrayToString(value: Uint8Array<ArrayBuffer>, encode = 'utf-8'): string {
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

/** Check if is valid ZanixHex */
export const isZanixHex: (str: string) => boolean = (str: string) => /^Zx[0-9a-fA-F]+$/.test(str)
