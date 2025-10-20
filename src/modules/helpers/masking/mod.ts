import type {
  BaseMaskingFunction,
  MaskingBaseMethods,
  MaskingFunction,
  MaskingMainOptions,
  MaskingMethods,
  MaskingOptions,
  UnMaskingOptions,
} from 'typings/masking.ts'

import { xorMask, xorUnmask } from './xor.ts'
import { baseMask, baseUnmask } from './base.ts'
import { hardMask, hardUnmask } from './hard.ts'

const methods: Record<MaskingMethods, MaskingFunction> = {
  xorMask,
  xorUnmask,
  hardMask,
  hardUnmask,
}

const baseMasking: Record<`base${MaskingBaseMethods}`, BaseMaskingFunction> = {
  baseMask,
  baseUnmask,
}

/**
 * Generic masking methods implementation
 * @param input
 * @param mask
 * @param options
 * @returns
 */
function genericMasking<T extends string | string[]>(
  input: T,
  mask: string,
  { algorithm = 'xor', method, ...opts }: MaskingMainOptions,
): T {
  const maskingFn = methods[`${algorithm}${method}`]
  const baseMaskingFn = baseMasking[`base${method}`]

  const fn = (value: string) => baseMaskingFn(value, (_input) => (maskingFn(_input, mask)), opts)

  if (typeof input === 'string') return fn(input) as T

  const data: string[] = []
  for (const value of input) {
    data.push(fn(value))
  }
  return data as T
}

/**
 * Masks the text or array of texts using a provided key.
 * This function applies the algorithm on the input data with the masking key and returns the masked data.
 *
 * If the `input` is a string or an array of strings, the masking operation will be performed on each string or the single string.
 *
 * @param {T} input - The text or array of texts to be masked. It can be a single string or an array of strings.
 * @param {string} mask - The masking key used in the operation.
 *        If selected `algorithm` is `hard`, this value should be a single character and will be used to replace specified characters in the input.
 * @param {MaskingOptions} options - The masking options
 *        - `algorithm`: Optional masking algorithm to apply.
 *                       When set to `'hard'`, performs irreversible masking by replacing specified characters with the `mask` character value.
 *                       Defaults to `'xor'`.
 *        - `startAfter`: The number of characters or the character after which masking starts, excluding this point.
 *                        Defaults to {0}, meaning masking starts from the first character.
 *        - `endBefore`: The number of characters or the character before which masking stops, excluding this point.
 *                        Masking stops just before the specified number of characters from the end of the string (moving to the left), or the specified character.
 *                        If not provided, masking will continue to the end of the string.
 * @returns {T} - The masked text or array of texts. If the input is an array, the return will be an array of masked texts.
 * @template T extends string | string[]
 */
export function mask<T extends string | string[]>(
  input: T,
  mask: string,
  options: MaskingOptions = {},
): T {
  return genericMasking(input, mask, { method: 'Mask', ...options })
}

/**
 * Unmasks the text or array of texts using the same masking key.
 * This function applies the algorithm on the masked data with the same key and returns the original data.
 *
 * If the `input` is a string or an array of strings, the unmasking operation will be performed on each string or the single string.
 *
 * @param {T} input - The masked text or array of texts to be unmasked. It can be a single string or an array of strings.
 * @param {string} mask - The masking secret key used in the operation.
 * @param {UnMaskingOptions} options - The masking options
 *        - `algorithm`: The optional algorithm to use for masking. Defaults to 'xor'
 *        - `startAfter`: The number of characters or the character after which masking starts, excluding this point.
 *                        Defaults to {0}, meaning masking starts from the first character.
 *        - `endBefore`: The number of characters or the character before which masking stops, excluding this point.
 *                        Masking stops just before the specified number of characters from the end of the string (moving to the left), or the specified character.
 *                        If not provided, masking will continue to the end of the string.
 * @returns {T} - The unmasked text or array of texts. If the input is an array, the return will be an array of unmasked texts.
 * @template T extends string | string[]
 */
export function unmask<T extends string | string[]>(
  input: T,
  mask: string,
  options: UnMaskingOptions = {},
): T {
  return genericMasking(input, mask, { method: 'Unmask', ...options })
}
