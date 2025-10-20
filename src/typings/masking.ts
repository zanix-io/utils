/**
 * Text masking process.
 *
 * @example
 * Given the string:
 * "my input",
 * startAfter: 1 (mask after the first character, excluding this point),
 * endBefore: 2 (mask up to two characters before the end, excluding this point),
 * The result would be: "m*****ut"
 */
export type MaskingBaseOptions = {
  /**
   * The number of characters or the character after which masking starts, excluding this point.
   * Defaults to {0}, meaning masking starts from the first character.
   */
  startAfter?: number | string
  /**
   * The number of characters or the character before which masking stops, excluding this point.
   * Masking stops just before the specified number of characters from the end of the string (moving to the left), or the specified character.
   * If not provided, masking will continue to the end of the string.
   */
  endBefore?: number | string
}

export type MaskingBaseMethods = 'Mask' | 'Unmask'

export type MaskingMainOptions =
  & { algorithm?: MaskingAlgorithms; method: MaskingBaseMethods }
  & MaskingBaseOptions

export type MaskingOptions = {
  /**
   * Optional masking algorithm to apply.
   * When set to `'hard'`, performs irreversible masking by replacing specified characters with the `mask` character value.
   * Defaults to `'xor'`.
   */
  algorithm?: MaskingAlgorithms
} & MaskingBaseOptions

export type UnMaskingOptions = {
  /**
   * Optional masking algorithm to apply. Defaults to `'xor'`.
   */
  algorithm?: Exclude<MaskingAlgorithms, 'hard'>
} & MaskingBaseOptions

export type MaskingAlgorithms = 'xor' | 'hard'

export type MaskingMethods = `${MaskingAlgorithms}${MaskingBaseMethods}`

export type MaskingFunction = (input: string, mask: string) => string

export type BaseMaskingFunction = (
  input: string,
  callback: (value: string) => string,
  options?: MaskingBaseOptions,
) => string
