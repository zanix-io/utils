/** The hashing strength level used by `generateHash`/`validateHash` for unidirectional encryption. */
export type EncryptionLevel = 'low' | 'medium' | 'medium-high' | 'high'
/** The supported AES key lengths, in bits. */
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

/** The supported RSA key modulus lengths, in bits. */
export type ValidRSAModulusLength = 1024 | 2048 | 3072 | 4096

/** Options accepted when generating or using RSA keys. */
export type ValidRSAKeysOptions<T extends HashAlgorithm> = {
  /**
   * The encryption or signing RSA algorithm, used to select `generateRSAKeys()`'s WebCrypto
   * `keyUsages` at generation time ('RSA-OAEP' → `['encrypt', 'decrypt']`, anything else →
   * `['sign', 'verify']`). `signRSA`/`verifyRSA` always re-import the exported PKCS8/SPKI PEM
   * under their own fixed 'RSASSA-PKCS1-v1_5' (real "RS256" per RFC 7518 §3.3) regardless of which
   * of these was used at generation time — plain RSA PKCS8/SPKI export carries no
   * algorithm-specific key material, so any value here produces a keypair `signRSA`/`verifyRSA`
   * can use.
   * Defaults to 'RSA-OAEP'
   */
  algorithm?: 'RSA-OAEP' | 'RSA-PSS' | 'RSASSA-PKCS1-v1_5'
  /**
   * The encryption or signing RSA algorithm hash. Defaults to 'SHA-256'
   */
  hash?: T
  /**
   *   The public key modulus (n) size. Defaults to 2048.
   */
  modulusLength?: 'SHA-512' extends T ? Exclude<ValidRSAModulusLength, 1024>
    : ValidRSAModulusLength
}
