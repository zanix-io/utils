import type { EncryptionLevel, HashAlgorithm } from 'typings/encryption.ts'

import {
  hexToUint8Array,
  stringToUint8Array,
  uint8ArrayToBase64,
  uint8ArrayToHEX,
} from 'utils/strings.ts'

async function* iterateAsync(iterations: number) {
  for (let i = 0; i < iterations; i++) {
    yield i
  }
}

function generateSalt(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

const encriptionLevel: Record<EncryptionLevel, { algorithm: HashAlgorithm; iterations: number }> = {
  low: {
    algorithm: 'SHA-1',
    iterations: 1000,
  },
  medium: {
    algorithm: 'SHA-256',
    iterations: 5000,
  },
  'medium-high': {
    algorithm: 'SHA-384',
    iterations: 8000,
  },
  high: {
    algorithm: 'SHA-512',
    iterations: 10000,
  },
}

/**
 * Generates a base64 SHA hash. Used for `unidirectional` encryption.
 *
 * @param {string} message - The text to be encrypted.
 * @param {EncryptionLevel} [level='medium'] - The encryption strength level. Can be 'low', 'medium', or 'high'. Default is 'medium'
 * @param {Uint8Array | number | false} [useSalt=16] - The salt or the number of salt to use for hashing. If `false`, no salt is used. Default is 16.
 *
 * @example
 * ```ts
 * const hash = await generateHash("hello world", 'low');
 * console.log(hash); // Base64 encoded hash
 * ```
 *
 * @returns {Promise<string>} A string containing the generated hash in base64 format.
 */
export async function generateHash(
  message: string,
  level: EncryptionLevel = 'medium',
  useSalt: Uint8Array | number | false = 16,
): Promise<string> {
  const { algorithm, iterations } = encriptionLevel[level]
  const data = stringToUint8Array(message)
  let dataToEncrypt = data
  let saltPrefix = ''

  if (useSalt) {
    const salt = typeof useSalt === 'number' ? generateSalt(useSalt) : useSalt

    dataToEncrypt = new Uint8Array(data.length + salt.length)
    dataToEncrypt.set(dataToEncrypt)
    dataToEncrypt.set(salt, data.length)
    saltPrefix = `${uint8ArrayToHEX(salt)}$`
  }

  let encrypted = await crypto.subtle.digest(algorithm, dataToEncrypt)

  for await (const _ of iterateAsync(iterations)) {
    encrypted = await crypto.subtle.digest(algorithm, new Uint8Array(encrypted))
  }

  return `${saltPrefix}${uint8ArrayToBase64(new Uint8Array(encrypted))}`
}

/**
 * Validates if the provided SHA message matches the stored hash. Used for `unidirectional` encryption.
 *
 * @param {string} inputMessage - The message to validate against the stored hash.
 * @param {string} storedHash - The pre-existing hash to compare the input message against.
 * @param {EncryptionLevel} [level='medium'] - The encryption strength level used for validation. Can be 'low', 'medium', or 'high'.
 *
 * @example
 * ```ts
 * const isValid = await validateHash("hello world", storedHash, 'low');
 * console.log(isValid); // true if the input matches the stored hash
 * ```
 *
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the input message matches the stored hash.
 */
export async function validateHash(
  inputMessage: string,
  storedHash: string,
  level: EncryptionLevel = 'medium',
): Promise<boolean> {
  const splittedHash = storedHash.split('$')
  const storagedSalt = splittedHash.length > 1 ? hexToUint8Array(splittedHash[0]) : false
  const inputHash = await generateHash(inputMessage, level, storagedSalt)

  return inputHash === storedHash
}
