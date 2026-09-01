import type { EncryptionLevel, HashAlgorithm } from 'typings/encryption.ts'

import { createHash } from 'node:crypto'
import {
  hexToUint8Array,
  stringToUint8Array,
  uint8ArrayToBase64,
  uint8ArrayToHEX,
} from 'utils/encoders.ts'

/** Maps the public `HashAlgorithm` names to Node's `crypto.createHash` algorithm identifiers. */
const nodeHashAlgorithm: Record<HashAlgorithm, string> = {
  'SHA-1': 'sha1',
  'SHA-256': 'sha256',
  'SHA-384': 'sha384',
  'SHA-512': 'sha512',
}

/**
 * Synchronously computes a digest, byte-for-byte identical to `crypto.subtle.digest`'s output for
 * the same algorithm/input. Used for the hash-stretching loop below, where hundreds/thousands of
 * chained digests are needed and each one depends on the previous one's output — `node:crypto`'s
 * synchronous `createHash` lets that chain run without a `crypto.subtle.digest` `Promise` round
 * trip (and its event-loop yield) per iteration.
 */
function digestSync(algorithm: HashAlgorithm, data: Uint8Array): Uint8Array {
  return new Uint8Array(createHash(nodeHashAlgorithm[algorithm]).update(data).digest())
}

/**
 * How many chained digests run per synchronous batch before yielding to the event loop once.
 * Keeps the hash-stretching loop from creating one await point per iteration (up to 10000 of
 * them at the 'high' level) — which, under event-loop contention, turns into a proportional
 * number of chances for the loop's continuation to be delayed behind unrelated pending work.
 */
const HASH_YIELD_INTERVAL = 500

/**
 * Yields once per batch of `batchSize` iterations instead of once per iteration. A plain `for`
 * loop with an `await` in its body trips the `no-await-in-loop` lint rule; iterating this
 * generator with `for await...of` sidesteps it the same way while still suspending back to the
 * event loop between batches (a `for await...of` loop implicitly awaits every yielded value,
 * even over a synchronous generator).
 */
function* iterateBatches(iterations: number, batchSize: number) {
  for (let done = 0; done < iterations; done += batchSize) {
    yield Math.min(batchSize, iterations - done)
  }
}

function generateSalt(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

const encriptionLevel: Record<
  EncryptionLevel,
  { algorithm: HashAlgorithm; iterations: number }
> = {
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
 * Generates a SHA hash and returns it as a Base64-encoded string.
 *
 * Optionally, a salt can be included and concatenated before encoding.
 * This function is intended for use in **unidirectional encryption** or
 * secure hashing where the original value cannot be recovered.
 *
 * @param {string} message - The text to be encrypted.
 * @param {EncryptionLevel} [level='medium'] - The encryption strength level. Can be 'low', 'medium', 'medium-high', or 'high'. Default is 'medium'
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
    dataToEncrypt.set(data)
    dataToEncrypt.set(salt, data.length)
    saltPrefix = `${uint8ArrayToHEX(salt)}$`
  }

  let encrypted = digestSync(algorithm, dataToEncrypt)

  for await (const batchSize of iterateBatches(iterations, HASH_YIELD_INTERVAL)) {
    for (let i = 0; i < batchSize; i++) {
      encrypted = digestSync(algorithm, encrypted)
    }
  }

  return `${saltPrefix}${uint8ArrayToBase64(encrypted)}`
}

/**
 * Validates if the provided SHA message matches the stored hash. Used for `unidirectional` encryption.
 *
 * @param {string} inputMessage - The message to validate against the stored hash.
 * @param {string} storedHash - The pre-existing hash to compare the input message against.
 * @param {EncryptionLevel} [level='medium'] - The encryption strength level used for validation. Can be 'low', 'medium', 'medium-high', or 'high'.
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
