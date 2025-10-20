import type { AESLength } from 'typings/encryption.ts'

import {
  base64ToUint8Array,
  hexToUint8Array,
  stringToUint8Array,
  uint8ArrayToBase64,
  uint8ArrayToHEX,
} from 'utils/strings.ts'
import { baseEncrypt } from './base.ts'

function importAESKey(key: string, exports: boolean = true) {
  return crypto.subtle.importKey(
    'raw',
    base64ToUint8Array(key).buffer,
    { name: 'AES-GCM' },
    exports, // Whether the key can be exported
    ['encrypt', 'decrypt'], // Key usages (encryption and decryption)
  )
}

/**
 * A function to generate AES Key. Using 'AES-GCM' algorithm
 *
 * @param {AESLength} length - AES key length (128, 192, or 256 bits). Defaults to 128
 *
 * @returns {Promise<CryptoKey>} - Base64 encoded AES key
 */
export async function generateAESKey(length: AESLength = 128): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length },
    true, // Whether the key can be exported
    ['encrypt', 'decrypt'], // Key usages (encryption and decryption)
  )

  return uint8ArrayToBase64(new Uint8Array(await crypto.subtle.exportKey('raw', key)))
}

/**
 *  A function to generate a custom base64 key for AES.
 * @param secret - Secret for AES. Max length: 32.
 * @returns {string}
 */
export function generateCustomAESKey(secret: string): string {
  const keyBuffer = stringToUint8Array(secret)

  const lengths = [16, 24, 32]

  const adjustedLength = lengths.find((length) => keyBuffer.length <= length) || 32

  // Creamos el ArrayBuffer adecuado (rellenado o truncado)
  const adjustedKey = new Uint8Array(adjustedLength)
  adjustedKey.set(keyBuffer.slice(0, adjustedLength)) // Rellenamos o truncamos según sea necesario

  return uint8ArrayToBase64(adjustedKey)
}

/**
 * Encrypt a message using 'AES-GCM' as `symmetric` encryption.
 *
 * @param {string | string[]} message - The text to be encrypted.
 * @param {string} key - The base64 encryption AES key.
 * @param {number} ivLength - The iv length (12 or 16). Defaults to 12
 *
 * @example
 * ```ts
 * const encrypted = await encryptAES("hello world", key);
 * console.log(encrypted); // Base64 encrypted message
 * ```
 *
 * @returns {Promise<string | string[]>} A base64 string containing the encripted message.
 */
export function encryptAES<T extends string | string[]>(
  message: T,
  key: string,
  ivLength: 12 | 16 = 12,
): Promise<T> {
  return baseEncrypt(message, async (input) => {
    const encodedMessage = stringToUint8Array(input)
    const aesKey = await importAESKey(key)

    // Generate a random initialization vector (IV)
    const iv = crypto.getRandomValues(new Uint8Array(ivLength))

    // Encrypt the message
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      aesKey,
      encodedMessage,
    )

    return `${uint8ArrayToHEX(iv)}$${uint8ArrayToBase64(new Uint8Array(encrypted))}` as T
  }) as Promise<T>
}

/**
 * Decrypt a message using 'AES-GCM' as `symmetric` encryption.
 *
 * @param {string | string[]} encryptedData - The  base64 text to be decrypted.
 * @param {string} key - The base64 encryption AES key.
 *
 * @example
 * ```ts
 * const decrypted = await decryptAES("hello world", key);
 * console.log(decrypted); // Decrypted message
 * ```
 *
 * @returns {Promise<string | string[]>} A string containing the decrypted message.
 */
export function decryptAES<T extends string | string[]>(
  encryptedData: T,
  key: string,
): Promise<T> {
  return baseEncrypt(encryptedData, async (input) => {
    const [hexIV, base64Ciphertext] = input.split('$')
    const aesKey = await importAESKey(key)

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: hexToUint8Array(hexIV) as BufferSource,
      },
      aesKey,
      base64ToUint8Array(base64Ciphertext),
    )

    return atob(uint8ArrayToBase64(new Uint8Array(decrypted))) as T
  }) as Promise<T>
}
