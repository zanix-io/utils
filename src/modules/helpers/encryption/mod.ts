import { decryptRSA, encryptRSA, generateRSAKeys, signRSA, verifyRSA } from './asymmetric.ts'
import { decryptAES, encryptAES, generateAESKey, generateCustomAESKey } from './symmetric.ts'
import { generateHash, validateHash } from './unidirectional.ts'

/**
 * Encrypt a message using 'AES-GCM' or 'RSA-OAEP' as `symmetric` and `asymmetric` encryption.
 *
 * @param {string | string[]} message - The text to be encrypted.
 * @param {string} key - The encryption AES key or the RSA Private Key.
 *
 * @example
 * ```ts
 * const encrypted = await encryptAES("hello world", key);
 * console.log(encrypted); // Base64 encrypted message
 * ```
 *
 * @returns {Promise<string | string[]>} A base64 string containing the encripted message.
 */
export function encrypt(
  message: string | string[],
  key: string | CryptoKey,
): Promise<string | string[]> {
  if (typeof key === 'string') return encryptAES(message, key)
  return encryptRSA(message, key)
}

/**
 * Decrypt a message using 'AES-GCM' or 'RSA-OAEP' as `symmetric` and `asymmetric` encryption.
 *
 * @param {string | string[]} encryptedMessage - The text to be decrypted.
 * @param {string} key - The encryption AES key or the RSA Public Key.
 *
 * @example
 * ```ts
 * const encrypted = await encryptAES("hello world", key);
 * console.log(encrypted); // Base64 encrypted message
 * ```
 *
 * @returns {Promise<string | string[]>} The decrypted message
 */
export function decrypt(
  encryptedMessage: string | string[],
  key: string | CryptoKey,
): Promise<string | string[]> {
  if (typeof key === 'string') return decryptAES(encryptedMessage, key)
  return decryptRSA(encryptedMessage, key)
}

export {
  decryptAES,
  decryptRSA,
  encryptAES,
  encryptRSA,
  generateAESKey,
  generateCustomAESKey,
  generateHash,
  generateRSAKeys,
  signRSA,
  validateHash,
  verifyRSA,
}
