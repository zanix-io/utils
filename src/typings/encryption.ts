export type EncryptionLevel = 'low' | 'medium' | 'medium-high' | 'high'
export type AESLength = 128 | 192 | 256

/**
 * A type representing supported cryptographic hash algorithms.
 *
 * These algorithms are used to generate fixed-size hash values from input data.
 * The available algorithms are part of the SHA family, which is widely used for
 * secure data hashing and cryptographic operations.
 */
export type HashAlgorithm =
  | 'SHA-1' // The SHA-1 hashing algorithm (not recommended for cryptographic purposes due to vulnerabilities)
  | 'SHA-256' // The SHA-256 hashing algorithm, part of the SHA-2 family and widely used for secure hashing
  | 'SHA-384' // The SHA-384 hashing algorithm, a member of the SHA-2 family with a longer output length
  | 'SHA-512' // The SHA-512 hashing algorithm, another member of the SHA-2 family with even more bits for stronger security

export type ValidRSAModulusLength = 1024 | 2048 | 3072 | 4096

export type ValidRSAKeysOptions<T extends HashAlgorithm> = {
  /**
   * The encryption or signing RSA algorithm.
   * Using 'RSA-OAEP' algorithm for encryption and 'RSA-PSS' for signing.
   * Defaults to 'RSA-OAEP'
   */
  algorithm?: 'RSA-OAEP' | 'RSA-PSS'
  /**
   * The encryption or signing RSA algorithm hash. Defaults to 'SHA-256'
   */
  hash?: T
  /**
   *   The public key módulo 𝑛 size. Defaults to 2048.
   */
  modulusLength?: 'SHA-512' extends T ? Exclude<ValidRSAModulusLength, 1024> : ValidRSAModulusLength
}
