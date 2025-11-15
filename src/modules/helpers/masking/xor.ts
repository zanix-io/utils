import type { MaskingFunction } from 'typings/masking.ts'

import {
  hexToUint8Array,
  isZanixHex,
  stringToUint8Array,
  uint8ArrayToHEX,
  uint8ArrayToString,
} from 'utils/encoders.ts'
import { ZANIX_PREFIX } from './base.ts'

/**
 * XOR masking function
 * @param inputBuffer
 * @param mask
 * @returns {Uint8Array<ArrayBuffer>}
 */
function xorMasking(inputBuffer: Uint8Array<ArrayBuffer>, mask: string): Uint8Array<ArrayBuffer> {
  const maskBuffer = stringToUint8Array(mask)

  const result = new Uint8Array(inputBuffer.length)

  // XOR byte a byte
  for (let i = 0; i < inputBuffer.length; i++) {
    result[i] = inputBuffer[i] ^ maskBuffer[i % maskBuffer.length]
  }
  return result
}

/**
 * XOR masking
 * @param input
 * @param mask
 * @returns
 */
export const xorMask: MaskingFunction = (input, mask) => {
  const inputBuffer = stringToUint8Array(input)
  const result = xorMasking(inputBuffer, mask)
  return ZANIX_PREFIX + uint8ArrayToHEX(result)
}

/**
 * XOR unmasking
 * @param maskedInput
 * @param mask
 * @returns
 */
export const xorUnmask: MaskingFunction = (maskedInput, mask) => {
  if (!isZanixHex(maskedInput)) return maskedInput

  maskedInput = maskedInput.slice(2)

  const maskedBuffer = hexToUint8Array(maskedInput) as Uint8Array<ArrayBuffer>

  const result = xorMasking(maskedBuffer, mask)
  return uint8ArrayToString(result)
}
