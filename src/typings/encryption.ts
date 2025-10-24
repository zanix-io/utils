export type EncryptionLevel = 'low' | 'medium' | 'medium-high' | 'high'
export type AESLength = 128 | 192 | 256

export type HashAlgorithm =
  | 'SHA-1'
  | 'SHA-256'
  | 'SHA-384'
  | 'SHA-512'

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
