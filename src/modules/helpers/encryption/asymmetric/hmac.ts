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
 * const signature = await signHHMAC(data, secret, { hash: 'SHA-256', algorithm: 'RS256' });
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
 * @returns {Promise<Uint8Array>} The generated HMAC signature as a `Uint8Array`.
 *
 * @returns A boolean indicating whether the signature is valid.
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
