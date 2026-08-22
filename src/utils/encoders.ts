import { ApplicationError } from 'modules/errors/main.ts'

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
 * Strips `//` line comments and `/* ... *\/` block comments from a JSONC string.
 *
 * Walks the input character by character, tracking whether it's currently inside a double-quoted
 * JSON string (respecting `\"`/`\\` escapes) so a `//` or `/* ... *\/`-shaped substring that
 * happens to appear inside a string value (e.g. a glob like `"src/@tests/**\/*.test.ts"`) is never
 * mistaken for a real comment. Comment detection only ever applies outside of a string.
 *
 * An unterminated block comment (a `/*` with no matching `*\/`) is left untouched rather than
 * silently consuming the rest of the input, mirroring how a plain regex would simply fail to match
 * it.
 *
 * Use with care for trusted input — this is a lightweight comment stripper, not a full JSONC
 * parser (it doesn't validate structure, and things like trailing commas are still up to the
 * caller's own `JSON.parse`).
 *
 * @param value
 */
export function stripComments(value: string): string {
  let result = ''
  let inString = false

  for (let i = 0; i < value.length; i++) {
    const char = value[i]

    if (inString) {
      result += char
      if (char === '\\' && i + 1 < value.length) {
        result += value[++i] // keep the escaped character verbatim (handles \" and \\)
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      result += char
      continue
    }

    if (char === '/' && value[i + 1] === '/') {
      const lineEnd = value.indexOf('\n', i)
      result = result.replace(/[ \t]*$/, '') // drop whitespace already emitted before the comment
      i = lineEnd === -1 ? value.length - 1 : lineEnd - 1
      continue
    }

    if (char === '/' && value[i + 1] === '*') {
      const commentEnd = value.indexOf('*/', i + 2)
      if (commentEnd === -1) {
        result += value.slice(i) // unterminated: leave the rest of the input untouched
        break
      }
      i = commentEnd + 1
      continue
    }

    result += char
  }

  return result
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
  return [...uint8Array].map((byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  )
}

/**
 * Convert a hexadecimal string to a Uint8Array.
 *
 * @param {string} hex - The hex string to be converted.
 * @returns {Uint8Array} The resulting Uint8Array.
 * @throws {ApplicationError} If `hex` (after stripping whitespace) has an odd length.
 */
export function hexToUint8Array(hex: string): Uint8Array {
  // Remove any spaces, if present, and ensure the hex string is even length
  hex = hex.replace(/\s+/g, '').toLowerCase()

  // Check for invalid length (it should always be even)
  if (hex.length % 2 !== 0) {
    throw new ApplicationError('Hex string must have an even length', {
      code: 'UTILS_ENCODERS_HEX_ODD_LENGTH',
      meta: { hex },
    })
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
  const base64 = btoa(
    input instanceof Uint8Array ? String.fromCharCode(...input) : input,
  )
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Decodes a Base64 URL-safe encoded string into a `Uint8Array`.
 *
 * This function takes a Base64 URL-safe encoded string and decodes the string back to its original
 * byte representation in a `Uint8Array`.
 *
 * @param {string} input - The Base64 URL-safe encoded string to decode.
 * @param {boolean} toString - If `true`, the function will ensure that the input is converted to a string.
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

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/**
 * Encodes a `Uint8Array` into a Base32 string (RFC 4648), using the uppercase `A-Z2-7` alphabet
 * with no padding — the conventional format for secrets shown to/typed into authenticator apps
 * (TOTP) and similar systems.
 *
 * @param {Uint8Array} bytes - The raw bytes to encode.
 * @returns {string} The Base32-encoded string.
 *
 * @example
 * const encoded = base32Encode(new TextEncoder().encode('hello'));
 * console.log(encoded); // Output: 'NBSWY3DP'
 */
export const base32Encode = (bytes: Uint8Array): string => {
  let bits = 0
  let value = 0
  let output = ''

  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f]
  }

  return output
}

/**
 * Decodes a Base32-encoded string (RFC 4648) into a `Uint8Array`. Tolerant of lowercase input and
 * optional `=` padding, since not every producer (QR generators, manual entry) emits the same
 * casing/padding.
 *
 * @param {string} input - The Base32-encoded string to decode.
 * @returns {Uint8Array} The decoded bytes.
 * @throws {ApplicationError} If `input` contains a character outside the Base32 alphabet.
 *
 * @example
 * const decoded = base32Decode('NBSWY3DP');
 * console.log(new TextDecoder().decode(decoded)); // Output: 'hello'
 */
export const base32Decode = (input: string): Uint8Array => {
  const clean = input.toUpperCase().replace(/=+$/, '')

  let bits = 0
  let value = 0
  const bytes: number[] = []

  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) {
      throw new ApplicationError(`Invalid Base32 character: '${char}'`, {
        code: 'UTILS_ENCODERS_BASE32_INVALID_CHAR',
        meta: { char },
      })
    }

    value = (value << 5) | index
    bits += 5

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }

  return new Uint8Array(bytes)
}

/** Check if is valid ZanixHex */
export const isZanixHex: (str: string) => boolean = (str: string): boolean =>
  /^Zx[0-9a-fA-F]+$/.test(str)

/**
 * Compare two Uint8Array objects for equality, in constant time with respect to their content.
 *
 * Runs over every byte regardless of where (or whether) a mismatch occurs — there's no early
 * exit once lengths are confirmed equal, so how long this takes never leaks how many leading
 * bytes of `b` happened to match `a`. This matters for any comparison of secret bytes (an HMAC
 * signature, an API key, a token) against caller-supplied input: an early-exit compare lets a
 * remote attacker recover the secret one byte at a time by timing repeated guesses, since a guess
 * whose first byte matches takes measurably longer than one that doesn't.
 *
 * A length mismatch alone returns `false` immediately — safe to short-circuit on, since for a
 * fixed-length secret (any HMAC digest, for instance) the length itself carries no information
 * about the secret's actual bytes.
 *
 * @param a - The first Uint8Array to compare.
 * @param b - The second Uint8Array to compare.
 * @returns `true` if the arrays are equal, otherwise `false`.
 */
export const compareUint8Arrays = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false

  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i]
  }
  return diff === 0
}
