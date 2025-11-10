import type { MaskingFunction } from 'typings/masking.ts'
import logger from 'modules/logger/mod.ts'

/**
 * Function to perform irreversible masking
 * @param input
 * @param mask
 * @returns
 */
export const hardMask: MaskingFunction = (input, mask) => {
  if (mask.length > 1) {
    logger.warn(
      'If the selected algorithm is `hard`, the `mask` value should be a single character. Using the first character instead.',
      {
        code: 'MASKING_HARD_MASK_INVALID_LENGTH',
        meta: {
          function: 'hardMask',
          algorithm: 'hard',
          providedMaskLength: mask.length,
          usedMask: mask[0],
          source: 'zanix',
        },
      },
    )
    mask = mask[0]
  }
  return mask.repeat(input.length)
}

/**
 * Default function to prevent unmasking when using the `hard` algorithm
 * @param val
 * @returns
 */
export const hardUnmask: MaskingFunction = (val) => {
  logger.warn('A value cannot be unmasked when using the `hard` algorithm.', {
    code: 'MASKING_HARD_UNMASK_ATTEMPT',
    meta: { function: 'hardUnmask', algorithm: 'hard', source: 'zanix' },
  })
  return val
}
