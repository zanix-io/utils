import type { HashAlgorithm, ValidRSAKeysOptions } from 'typings/encryption.ts'

import { base64ToUint8Array, stringToUint8Array, uint8ArrayToBase64 } from 'utils/strings.ts'
import { baseEncrypt } from './base.ts'

function importRSAKey(
  pem: string,
  type: 'public' | 'private',
  algorithm: ValidRSAKeysOptions<never>['algorithm'] = 'RSA-OAEP',
) {
  const binary = Uint8Array.from(
    atob(pem.replace(/-----(BEGIN|END) (PUBLIC|PRIVATE) KEY-----/g, '').trim()),
    (c) => c.charCodeAt(0),
  )

  const format = type === 'public' ? 'spki' : 'pkcs8' as const
  const usages: KeyUsage[] = type === 'public'
    ? algorithm === 'RSA-OAEP' ? ['encrypt'] : ['verify']
    : algorithm === 'RSA-OAEP'
    ? ['decrypt']
    : ['sign']

  return crypto.subtle.importKey(format, binary, { name: algorithm, hash: 'SHA-256' }, true, usages)
}

async function exportRSAKey(key: CryptoKey, type: 'spki' | 'pkcs8') {
  const exported = await crypto.subtle.exportKey(type, key)
  const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)))
  const formatted = base64.match(/.{1,64}/g)?.join('\n') ?? base64
  return type === 'spki'
    ? `-----BEGIN PUBLIC KEY-----\n${formatted}\n-----END PUBLIC KEY-----`
    : `-----BEGIN PRIVATE KEY-----\n${formatted}\n-----END PRIVATE KEY-----`
}

/**
 * A function to generate RSA Keys.
 * Using 'RSA-OAEP' algorithm for encryption and 'RSASSA-PKCS1-v1_5' for signing
 *
 * @param {ValidRSAKeysOptions} options
 *      - `hash`: The encryption RSA algorithm hash. Defaults to 'SHA-256'
 *      - `modulusLength`: The public key módulo 𝑛 size. Defaults to 2048.
 *
 * @returns {Promise<{ privateKey: string, publicKey: string }>} - Private and public RSA keys
 */
export async function generateRSAKeys<T extends HashAlgorithm>(
  { hash = 'SHA-256' as never, modulusLength = 2048, algorithm = 'RSA-OAEP' }: ValidRSAKeysOptions<
    T
  > = {},
): Promise<{ privateKey: string; publicKey: string }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: algorithm,
      hash,
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]), // standar value, recommended
    },
    true, // Whether the key can be exported
    algorithm === 'RSA-OAEP' ? ['encrypt', 'decrypt'] : ['sign', 'verify'], // Key usages (encryption and decryption or sign and verify)
  )

  const privateKey = await exportRSAKey(keyPair.privateKey, 'pkcs8')

  const publicKey = await exportRSAKey(keyPair.publicKey, 'spki')

  return { privateKey, publicKey }
}

/**
 * Encrypt a message using 'RSA-OAEP' as `asymmetric` encryption.
 *
 * @param {string | string[]} message - The text to be encrypted.
 * @param {string} publicKey - The encryption public RSA key.
 *
 * @example
 * ```ts
 * const encrypted = await encryptRSA("hello world", publicKey);
 * console.log(encrypted); // Base64 encrypted message
 * ```
 *
 * @returns {Promise<string | string[]>} A base64 string containing the encripted message.
 */
export function encryptRSA<T extends string | string[]>(message: T, publicKey: string): Promise<T> {
  return baseEncrypt(message, async (input) => {
    const encodedValue = stringToUint8Array(input)

    const key = await importRSAKey(publicKey, 'public')
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      key,
      encodedValue,
    )

    return uint8ArrayToBase64(new Uint8Array(encrypted)) as T
  }) as Promise<T>
}

/**
 * Signs a message using an RSA private key.
 *
 * Uses the `RSA-PSS` algorithm to create a digital signature of the given message.
 * This signature can be verified later using the corresponding public key.
 *
 * @param {string | string[]} message - The text to be encrypted.
 * @param {string} privateKey - The encryption private RSA key.
 *
 * @example
 * ```ts
 * const signed = await signRSA("hello world", privateKey);
 * console.log(signed); // Base64 signed message
 * ```
 *
 * @returns {Promise<string | string[]>} A base64 string containing the signed message.
 */
export function signRSA<T extends string | string[]>(message: T, privateKey: string): Promise<T> {
  return baseEncrypt(message, async (input) => {
    const encoded = stringToUint8Array(input)
    const algoritm = 'RSA-PSS'
    const key = await importRSAKey(privateKey, 'private', algoritm)
    const signature = await crypto.subtle.sign(
      { name: algoritm, saltLength: 32 },
      key,
      encoded,
    )

    return uint8ArrayToBase64(new Uint8Array(signature)) as T
  }) as Promise<T>
}

/**
 * Verifies an RSA signature using the corresponding public key.
 *
 * Uses the `RSA-PSS` algorithm to check if the given signature is valid
 * for the provided message and public key.
 *
 * @param {string | string[]} message - The original message that was signed.
 * @param {string} signatureBase64 - The base64-encoded signature to verify.
 * @param {string} publicKey - The RSA public key used to verify the signature.
 * @returns {Promise<boolean>} - `true` if the signature is valid, `false` otherwise.
 *
 * @throws {DOMException} - If the key is invalid or does not allow verification.
 */
export function verifyRSA<T extends string | string[]>(
  message: T,
  signatureBase64: string,
  publicKey: string,
): Promise<boolean> {
  return baseEncrypt(message, async (input) => {
    const encoded = stringToUint8Array(input)
    const signature = base64ToUint8Array(signatureBase64)
    const algoritm = 'RSA-PSS'
    const key = await importRSAKey(publicKey, 'public', algoritm)
    return crypto.subtle.verify(
      { name: algoritm, saltLength: 32 },
      key,
      signature,
      encoded,
    )
  }) as Promise<boolean>
}

/**
 * Decrypt a message using 'RSA-OAEP' as `asymmetric` encryption.
 *
 * @param {string | string[]} encryptedData - The  base64 text to be decrypted.
 * @param {string} privateKey - The encryption private RSA key.
 *
 * @example
 * ```ts
 * const decrypted = await decryptRSA(encrypted, privateKey);
 * console.log(decrypted); // Decrypted message
 * ```
 *
 * @returns {Promise<string | string[]>} A string containing the decrypted message.
 */
export function decryptRSA<T extends string | string[]>(
  encryptedData: T,
  privateKey: string,
): Promise<T> {
  return baseEncrypt(encryptedData, async (input) => {
    const key = await importRSAKey(privateKey, 'private')
    const decrypted = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      key,
      base64ToUint8Array(input),
    )

    return atob(uint8ArrayToBase64(new Uint8Array(decrypted))) as T
  }) as Promise<T>
}
