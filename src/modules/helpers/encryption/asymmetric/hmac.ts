import type { HashAlgorithm } from 'typings/encryption.ts'

import { compareUint8Arrays, stringToUint8Array } from 'utils/encoders.ts'

/**
 * Generates a HMAC cryptographic signature based on the specified algorithm.
 *
 * This function can generate HMAC signatures using the Web Crypto API.
 *
 * @param {string} data - The data to sign (usually the concatenation of the header and payload).
 * @param {string} secret - The secret key used for signing the data.
 * @param {Exclude<HashAlgorithm, 'SHA-1'>} [hash='SHA-256'] - The hash algorithm to use with HMAC (e.g., 'SHA-256', 'SHA-384'). Default is 'SHA-256'.
 * @returns {Promise<Uint8Array>} The generated HMAC signature as a `Uint8Array`.
 *
 * @example
 * ```ts
 * const data = 'header.payload';
 * const secret = 'my-secret-key';
 * const signature = await signHMAC(data, secret, 'SHA-256');
 * console.log(signature);
 * ```
 */
export const signHMAC = async (
  data: string,
  secret: string,
  hash: Exclude<HashAlgorithm, 'SHA-1'> = 'SHA-256',
): Promise<Uint8Array> => {
  // Convert secret to a byte array
  const key = stringToUint8Array(secret)
  const dataBuffer = stringToUint8Array(data) // Convert data to a byte array

  const algorithmConfig = { name: 'HMAC', hash: { name: hash } }

  // Import the key into a CryptoKey object
  const cryptoKey = await crypto.subtle.importKey('raw', key, algorithmConfig, false, ['sign'])

  // Sign the data and return the signature as a Uint8Array
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer)

  return new Uint8Array(signatureBuffer)
}

/**
 * Verify HMAC signature for the JWT using the specified algorithm.
 *
 * @param data - The data (header + payload) to verify.
 * @param signature - The decoded signature to compare.
 * @param secret - The secret key used for verification.
 * @param {Exclude<HashAlgorithm, 'SHA-1'>} [hash='SHA-256'] - The hash algorithm to use with HMAC (e.g., 'SHA-256', 'SHA-384'). Default is 'SHA-256'.
 * @returns {Promise<boolean>} A boolean indicating whether the signature is valid.
 */
export const verifyHMAC = async (
  data: string,
  signature: Uint8Array,
  secret: string,
  hash: Exclude<HashAlgorithm, 'SHA-1'> = 'SHA-256',
): Promise<boolean> => {
  const generatedSignature = await signHMAC(data, secret, hash)
  return compareUint8Arrays(generatedSignature, signature)
}

/**
 * Generates a HMAC signature over raw bytes, supporting the full {@link HashAlgorithm} range
 * (including `'SHA-1'`, which {@link signHMAC} deliberately excludes since JWT has no HS1
 * algorithm).
 *
 * Unlike {@link signHMAC}, both the key and the data are taken as `Uint8Array` instead of a
 * UTF-8 `string` — a key that's arbitrary random bytes (e.g. a TOTP secret) would be corrupted by
 * round-tripping it through a JS string, since bytes ≥128 don't map back to themselves through
 * UTF-8 encode/decode.
 *
 * @param {Uint8Array} key - The raw HMAC key bytes.
 * @param {Uint8Array} data - The raw data bytes to sign.
 * @param {HashAlgorithm} [hash='SHA-1'] - The hash algorithm to use with HMAC. Default is `'SHA-1'`.
 * @returns {Promise<Uint8Array>} The generated HMAC signature as a `Uint8Array`.
 *
 * @example
 * ```ts
 * const signature = await signHMACBytes(keyBytes, dataBytes, 'SHA-1');
 * ```
 */
export const signHMACBytes = async (
  key: Uint8Array<ArrayBuffer>,
  data: Uint8Array<ArrayBuffer>,
  hash: HashAlgorithm = 'SHA-1',
): Promise<Uint8Array> => {
  const algorithmConfig = { name: 'HMAC', hash: { name: hash } }

  const cryptoKey = await crypto.subtle.importKey('raw', key, algorithmConfig, false, ['sign'])
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data)

  return new Uint8Array(signatureBuffer)
}
