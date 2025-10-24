import { assert } from '@std/assert/assert'
import { assertEquals } from '@std/assert/assert-equals'
import {
  decryptAES,
  encryptAES,
  generateAESKey,
  generateCustomAESKey,
} from 'modules/helpers/encryption/symmetric.ts'
import { generateHash, validateHash } from 'modules/helpers/encryption/unidirectional.ts'
import {
  decryptRSA,
  encryptRSA,
  generateRSAKeys,
  signRSA,
  verifyRSA,
} from 'modules/helpers/encryption/asymmetric.ts'
import { base64ToUint8Array, uint8ArrayToHEX } from 'utils/strings.ts'
import { assertNotEquals } from '@std/assert'
import { decrypt, encrypt } from 'modules/helpers/encryption/mod.ts'

Deno.test('Unidirectional encryption or hash generation works correctly', async () => {
  const message = 'Este es un mensaje importante'

  // Default hash
  const hash = await generateHash(message)
  const newHash = await generateHash(message)
  const newHashLow = await generateHash(message, 'low')
  const newHashHigh = await generateHash(message, 'high')
  const newHashMH = await generateHash(message, 'medium-high')
  assert(hash !== newHash)
  assertEquals(hash.length, 77)
  assertEquals(newHashMH.length, 97)
  assertEquals(newHashHigh.length, 121)
  assert(await validateHash(message, hash) === true)
  assert(await validateHash('other message', hash) === false)
  assert(await validateHash(message, newHash) === true)
  assert(await validateHash('other message', newHash) === false)
  assert(await validateHash(message, newHashLow) === false)
  assert(await validateHash(message, newHashHigh) === false)
  assert(await validateHash(message, newHashLow, 'low') === true)
  assert(await validateHash(message, newHashHigh, 'high') === true)
  assert(await validateHash(message, newHashMH, 'medium-high') === true)
  assert(await validateHash('other message', newHashMH, 'medium-high') === false)

  // Hash without salt
  const hashWithoutSalt = await generateHash(message, 'low', false)
  const newHashWithoutSalt = await generateHash(message, 'low', false)
  assertEquals(hashWithoutSalt, newHashWithoutSalt)
  assertEquals(newHashWithoutSalt.length, 28)
  assert(await validateHash(message, hashWithoutSalt, 'low') === true)
  assert(await validateHash('other message', hashWithoutSalt, 'low') === false)

  // Hash with different salt
  const salt = crypto.getRandomValues(base64ToUint8Array(hashWithoutSalt))
  const hashWithOtherSalt = await generateHash(message, 'low', salt)
  assertEquals(hashWithOtherSalt.length - uint8ArrayToHEX(salt).length - 1, hashWithoutSalt.length) // comparing length without salts for low
  assert(await validateHash(message, hashWithOtherSalt, 'low') === true)
  assert(await validateHash('other message', hashWithOtherSalt, 'low') === false)

  const newHashWithOtherSalt = await generateHash(message, 'low', 11)
  assertEquals(newHashWithOtherSalt.length, 51)
  assert(await validateHash(message, newHashWithOtherSalt, 'low') === true)
  assert(await validateHash('other message', newHashWithOtherSalt, 'low') === false)
})

Deno.test('Asymmetric RSA encryption and decryption should works correctly', async () => {
  const message = 'Este es un mensaje importante'

  const { privateKey, publicKey } = await generateRSAKeys()
  const encryptedData = await encryptRSA(message, publicKey)
  const decryptedData = await decryptRSA(encryptedData, privateKey)

  assert(message !== encryptedData)
  assertEquals(message, decryptedData)

  const { privateKey: privateKey2, publicKey: publicKey2 } = await generateRSAKeys({
    modulusLength: 1024,
    hash: 'SHA-384',
  })
  const encryptedData2 = await encryptRSA(message, publicKey2)
  const decryptedData2 = await decryptRSA(encryptedData2, privateKey2)

  assert(message !== encryptedData2)
  assertEquals(message, decryptedData2)

  const { privateKey: privateKey3, publicKey: publicKey3 } = await generateRSAKeys({
    hash: 'SHA-512',
  })
  const encryptedData3 = await encryptRSA(message, publicKey3)
  const decryptedData3 = await decryptRSA(encryptedData3, privateKey3)

  assert(message !== encryptedData3)
  assertEquals(message, decryptedData3)

  const { privateKey: privateKey4, publicKey: publicKey4 } = await generateRSAKeys({
    modulusLength: 4096,
    hash: 'SHA-512',
  })
  const encryptedData4 = await encryptRSA(message, publicKey4)
  const decryptedData4 = await decryptRSA(encryptedData4, privateKey4)

  assert(message !== encryptedData4)
  assertEquals(message, decryptedData4)

  // Array
  const encryptedData5 = await encryptRSA([message, message + ' second'], publicKey4)
  const decryptedData5 = await decryptRSA(encryptedData5, privateKey4)

  assert(message !== encryptedData4[0])
  assert(message + ' second' !== encryptedData4[1])
  assertNotEquals(encryptedData5, decryptedData5)
  assertNotEquals(encryptedData5[0], encryptedData5[1])
  assertEquals([message, message + ' second'], decryptedData5)
})

Deno.test('Symmetric AES encryption and decryption should works correctly', async () => {
  const message = 'Este es un mensaje importante'

  const key = await generateAESKey()
  const encryptedData = await encryptAES(message, key)
  const decryptedData = await decryptAES(encryptedData, key)

  assertEquals(key.length, 24)
  assert(message !== encryptedData)
  assertEquals(message, decryptedData)

  //other key
  const key2 = await generateAESKey(192)
  const encryptedData2 = await encryptAES(message, key2)
  const decryptedData2 = await decryptAES(encryptedData2, key2)

  assertEquals(key2.length, 32)
  assert(message !== encryptedData2)
  assertEquals(message, decryptedData2)

  const key3 = await generateAESKey(256)
  const encryptedData3 = await encryptAES(message, key3)
  const decryptedData3 = await decryptAES(encryptedData3, key3)

  assertEquals(key3.length, 44)
  assert(message !== encryptedData3)
  assertEquals(message, decryptedData3)

  //other iv length
  const key4 = await generateAESKey()
  const encryptedData4 = await encryptAES(message, key4, 16)
  const decryptedData4 = await decryptAES(encryptedData4, key4)

  assert(message !== encryptedData4)
  assertEquals(message, decryptedData4)

  //custom key
  const key5 = generateCustomAESKey('my secret')
  assertEquals(atob(key5).length, 16)
  const encryptedData5 = await encryptAES(message, key5)
  const decryptedData5 = await decryptAES(encryptedData5, key5)

  assert(message !== encryptedData5)
  assertEquals(message, decryptedData5)

  const key6 = generateCustomAESKey('my secret custom key')
  assertEquals(atob(key6).length, 24)
  const encryptedData6 = await encryptAES(message, key6)
  const decryptedData6 = await decryptAES(encryptedData6, key6)

  assert(message !== encryptedData6)
  assertEquals(message, decryptedData6)

  const key7 = generateCustomAESKey('my secret custom key value for 32 key len')
  assertEquals(atob(key7).length, 32)
  const encryptedData7 = await encryptAES(message, key7)
  const decryptedData7 = await decryptAES(encryptedData7, key7)

  assert(message !== encryptedData7)
  assertEquals(message, decryptedData7)

  // Array
  const encryptedData8 = await encryptAES([message, message + ' second'], key7)
  const decryptedData8 = await decryptAES(encryptedData8, key7)

  assert(message !== encryptedData8[0])
  assert(message + ' second' !== encryptedData8[1])
  assertNotEquals(encryptedData8, decryptedData8)
  assertNotEquals(encryptedData8[0], encryptedData8[1])
  assertEquals([message, message + ' second'], decryptedData8)
})

Deno.test('General encryption and decryption should works correctly', async () => {
  const message = 'Este es un mensaje importante'

  const key = await generateAESKey()
  const encryptedData = await encrypt(message, key)
  const decryptedData = await decrypt(encryptedData, key)

  assert(message !== encryptedData)
  assertEquals(message, decryptedData)

  const { privateKey, publicKey } = await generateRSAKeys()

  const encryptedData1 = await encrypt(message, publicKey)
  const decryptedData1 = await decrypt(encryptedData1, privateKey)

  assert(message !== encryptedData1)
  assertEquals(message, decryptedData1)
})

Deno.test('RSA sign should works correctly', async () => {
  const message = 'Este es un mensaje importante'

  const { privateKey, publicKey } = await generateRSAKeys({ algorithm: 'RSA-PSS' })

  const signedData = await signRSA(message, privateKey)
  const verifiedData = await verifyRSA(message, signedData, publicKey)
  const unverifiedData = await verifyRSA('other message', signedData, publicKey)

  assert(message !== signedData)
  assert(verifiedData)
  assert(!unverifiedData)
})
