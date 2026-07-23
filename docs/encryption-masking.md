# Encryption & Masking

The `/helpers` subpath ships cryptographic and obfuscation utilities for four different needs.
Use **symmetric AES encryption** when both sides share (or can share) the same secret key and you
need the fastest reversible protection. Use **asymmetric RSA encryption** when you need to encrypt
with a public key that anyone can hold while only the private key holder can decrypt — or when you
need digital signatures (RSA-PSS, or HMAC for a symmetric-secret signature). Use **unidirectional
hashing** for values that must never be recovered, such as passwords, where you only ever need to
validate a match. Use **masking** when you need to obscure a value for logs or partial display
(reversible with `xor`, permanently destructive with `hard`).

All functions are asynchronous (they rely on the Web Crypto API) except `mask`, `unmask`, `signRSA`'s
key import, and `verifyRSA`, which are still `Promise`-based since `crypto.subtle` itself is async.

```ts
import { encrypt, generateAESKey } from 'jsr:@zanix/utils@[version]/helpers'
```

## Symmetric encryption (AES)

All symmetric functions use the `AES-GCM` algorithm.

| Function                                  | Description                                                                                                                                                                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `generateAESKey(length?)`                 | Generates a random AES-GCM key and returns it as a base64 string. `length` (`AESLength`: `128 \| 192 \| 256`) defaults to `128`.                                                                                                           |
| `generateCustomAESKey(secret, toString?)` | Derives a fixed-length AES key from an arbitrary secret string by hashing it with SHA-256 and padding to a valid AES length (16/24/32 bytes). Returns a base64 string when `toString` is `true` (default), or a `Uint8Array` when `false`. |
| `encryptAES(message, key, ivLength?)`     | Encrypts a string or an array of strings with the given base64 AES key. `ivLength` (`12 \| 16`) defaults to `12`.                                                                                                                          |
| `decryptAES(encryptedData, key)`          | Decrypts a value (or array of values) previously produced by `encryptAES` using the same key.                                                                                                                                              |
| `encrypt(message, key, type?)`            | Generic wrapper: routes to `encryptAES` unless `type === 'RSA'` or `key` starts with `-----BEGIN` (PEM), in which case `key` is treated as an RSA **public** key and it routes to `encryptRSA`.                                            |
| `decrypt(encryptedMessage, key, type?)`   | Generic wrapper: routes to `decryptAES` unless `type === 'RSA'` or `key` starts with `-----BEGIN` (PEM), in which case `key` is treated as an RSA **private** key and it routes to `decryptRSA`.                                           |

```ts
import {
  decryptAES,
  encryptAES,
  generateAESKey,
  generateCustomAESKey,
} from 'jsr:@zanix/utils@[version]/helpers'

// Random 128-bit key (base64)
const key = await generateAESKey()

// Or derive a key deterministically from any secret string
const derivedKey = await generateCustomAESKey('my-app-secret')

const encrypted = await encryptAES('hello world', key)
console.log(encrypted) // e.g. "a1b2c3...$Base64Ciphertext=="

const decrypted = await decryptAES(encrypted, key)
console.log(decrypted) // "hello world"

// Arrays are supported too
const encryptedMany = await encryptAES(['hello', 'world'], key)
const decryptedMany = await decryptAES(encryptedMany, key)
```

The generic `encrypt`/`decrypt` wrappers let you defer the AES-vs-RSA choice to the key you pass in:

```ts
import { decrypt, encrypt, generateAESKey } from 'jsr:@zanix/utils@[version]/helpers'

const key = await generateAESKey()

const encrypted = await encrypt('hello world', key) // uses AES (default)
const decrypted = await decrypt(encrypted, key)
console.log(decrypted) // "hello world"
```

## Asymmetric encryption (RSA)

RSA encryption uses `RSA-OAEP`, while RSA signing uses `RSA-PSS`. `signHMAC`/`verifyHMAC` are
included here because they live alongside the RSA module in the source tree, but HMAC is a
**symmetric** primitive: signing and verifying use the same secret.

| Function                                          | Description                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generateRSAKeys(options?)`                       | Generates a PEM-formatted `{ privateKey, publicKey }` pair. `options.hash` (`HashAlgorithm`, excluding `'SHA-1'`) defaults to `'SHA-256'`; `options.modulusLength` (`ValidRSAModulusLength`) defaults to `2048`; `options.algorithm` defaults to `'RSA-OAEP'` (use `'RSA-PSS'` if you want a key pair dedicated to signing). |
| `encryptRSA(message, publicKey)`                  | Encrypts a string or array of strings with an RSA **public** key using `RSA-OAEP`.                                                                                                                                                                                                                                           |
| `decryptRSA(encryptedData, privateKey)`           | Decrypts a value (or array of values) with the matching RSA **private** key using `RSA-OAEP`.                                                                                                                                                                                                                                |
| `signRSA(message, privateKey, hash?)`             | Signs a message with an RSA **private** key using `RSA-PSS`. `hash` defaults to `'SHA-256'`. Returns a `Uint8Array`.                                                                                                                                                                                                         |
| `verifyRSA(message, signature, publicKey, hash?)` | Verifies an `RSA-PSS` signature against the original message using the RSA **public** key. Returns a `Promise<boolean>`.                                                                                                                                                                                                     |
| `signHMAC(data, secret, hash?)`                   | Generates an HMAC signature over `data` using a shared `secret`. `hash` defaults to `'SHA-256'`. Returns a `Uint8Array`.                                                                                                                                                                                                     |
| `verifyHMAC(data, signature, secret, hash?)`      | Recomputes the HMAC over `data` with `secret` and compares it against `signature`. Returns a `Promise<boolean>`.                                                                                                                                                                                                             |

```ts
import {
  decryptRSA,
  encryptRSA,
  generateRSAKeys,
  signRSA,
  verifyRSA,
} from 'jsr:@zanix/utils@[version]/helpers'

const { privateKey, publicKey } = await generateRSAKeys()

// Encrypt with the public key, decrypt with the private key
const encrypted = await encryptRSA('hello world', publicKey)
const decrypted = await decryptRSA(encrypted, privateKey)
console.log(decrypted) // "hello world"

// Sign with the private key, verify with the public key
const signature = await signRSA('hello world', privateKey)
const isValid = await verifyRSA('hello world', signature, publicKey)
console.log(isValid) // true
```

The generic `encrypt`/`decrypt` wrappers documented above also accept RSA keys directly (public key
for `encrypt`, private key for `decrypt`), either by passing `type: 'RSA'` or by relying on the
automatic PEM detection (`-----BEGIN...`):

```ts
import { decrypt, encrypt } from 'jsr:@zanix/utils@[version]/helpers'

const encrypted = await encrypt('hello world', publicKey) // detected as RSA (PEM header)
const decrypted = await decrypt(encrypted, privateKey, 'RSA')
```

`signHMAC`/`verifyHMAC` use a shared secret instead of a key pair:

```ts
import { signHMAC, verifyHMAC } from 'jsr:@zanix/utils@[version]/helpers'

const secret = 'my-secret-key'
const signature = await signHMAC('header.payload', secret)

const isValid = await verifyHMAC('header.payload', signature, secret)
console.log(isValid) // true
```

## Unidirectional hashing

`generateHash`/`validateHash` use the SHA family and are intended for values that should never be
decrypted back, such as passwords. The strength is controlled by an `EncryptionLevel`, which maps
to a hash algorithm and an iteration count:

| Level                | Algorithm | Iterations |
| -------------------- | --------- | ---------- |
| `'low'`              | `SHA-1`   | 1000       |
| `'medium'` (default) | `SHA-256` | 5000       |
| `'medium-high'`      | `SHA-384` | 8000       |
| `'high'`             | `SHA-512` | 10000      |

| Function                                         | Description                                                                                                                                                                                                                               |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generateHash(message, level?, useSalt?)`        | Hashes `message` with the algorithm/iterations for `level` (defaults to `'medium'`). `useSalt` is a `Uint8Array`, a salt length in bytes (default `16`), or `false` to disable salting; the salt is prefixed to the returned base64 hash. |
| `validateHash(inputMessage, storedHash, level?)` | Recomputes the hash of `inputMessage` (reusing the salt embedded in `storedHash`, if any) and compares it against `storedHash`. Returns a `Promise<boolean>`.                                                                             |

```ts
import { generateHash, validateHash } from 'jsr:@zanix/utils@[version]/helpers'

const hash = await generateHash('S3cr3tP@ss', 'medium-high')
console.log(hash) // "<salt-hex>$<base64-hash>"

const isValid = await validateHash('S3cr3tP@ss', hash, 'medium-high')
console.log(isValid) // true

const isInvalid = await validateHash('wrong-password', hash, 'medium-high')
console.log(isInvalid) // false
```

## Masking

`mask`/`unmask` obscure part (or all) of a string or array of strings. Two algorithms are supported:

- **`'xor'`** (default) — reversible. The masked value can be restored with `unmask` using the same
  key.
- **`'hard'`** — irreversible. Masked characters are replaced with the `mask` value (which should be
  a single character; if a longer string is passed, only its first character is used and a warning
  is logged). Once masked with `'hard'`, the original value cannot be recovered — calling `unmask`
  with `algorithm: 'hard'` simply returns the masked value unchanged and logs a warning. Because of
  this, the public `unmask` type only accepts `'xor'` for `algorithm`.

| Function                        | Description                                                                                                                                                                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mask(input, mask, options?)`   | Masks a string or array of strings. `options.algorithm` (`MaskingAlgorithms`: `'xor' \| 'hard'`) defaults to `'xor'`. `options.startAfter`/`options.endBefore` (number of characters, or a character to search for) let you leave a prefix/suffix unmasked. |
| `unmask(input, mask, options?)` | Reverses `mask` for the `'xor'` algorithm using the same key and range options. Not meaningful for `'hard'`-masked values.                                                                                                                                  |

```ts
import { mask, unmask } from 'jsr:@zanix/utils@[version]/helpers'

// Reversible masking (default 'xor')
const masked = mask('4111 1111 1111 1234', 'my-secret', { startAfter: 0, endBefore: 4 })
console.log(masked) // e.g. "Zx1a2b3c... 1234"

const original = unmask(masked, 'my-secret', { endBefore: 4 })
console.log(original) // "4111 1111 1111 1234"

// Irreversible masking
const hardMasked = mask('4111 1111 1111 1234', '*', { algorithm: 'hard', endBefore: 4 })
console.log(hardMasked) // "**************** 1234"

// unmask on a 'hard'-masked value returns it unchanged and logs a warning
const stillMasked = unmask(hardMasked, '*')
console.log(stillMasked === hardMasked) // true

// Arrays are supported too
const maskedMany = mask(['secret-1', 'secret-2'], 'my-secret')
```

## See also

- [Helpers](./helpers.md)
- [Types reference](./types.md) — `EncryptionLevel`, `AESLength`, `HashAlgorithm`,
  `MaskingOptions`, `UnMaskingOptions`, `MaskingAlgorithms`, `ValidRSAKeysOptions`,
  `ValidRSAModulusLength`
