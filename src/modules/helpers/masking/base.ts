import type { BaseMaskingFunction, MaskingBaseOptions } from 'typings/masking.ts'

export const ZANIX_PREFIX = 'Zx'
export const MASKING_SEPARATOR = 'z7b7a6e787dx'

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
const masking = (
  input: string,
  method: (value: string) => string,
  { startAfter = 0, endBefore = 0, additionalInfo = '', originalLength }:
    & MaskingBaseOptions
    & { additionalInfo?: string; originalLength: number },
) => {
  try {
    let startIndex = 0
    let endIndex = 0
    let sum = 0

    if (typeof startAfter === 'string') {
      const index = input.indexOf(startAfter)
      startIndex = index !== -1 ? input.length - index : 0
    } else {
      startIndex = startAfter > 0 ? startAfter : 0
    }

    sum += startIndex

    if (typeof endBefore === 'string') {
      const index = input.lastIndexOf(endBefore)

      if (index !== -1) {
        const relativeEnd = input.length - index

        if (originalLength - relativeEnd <= startIndex) {
          sum -= startIndex
          startIndex = 0
        }

        endIndex = relativeEnd
      } else {
        endIndex = 0
      }
    } else {
      endIndex = endBefore > 0 ? endBefore : 0
    }

    sum += endIndex

    if (sum >= originalLength || sum === 0) return method(input)

    endIndex = input.length - endIndex

    const masked = `${input.slice(0, startIndex)}${method(input.slice(startIndex, endIndex))}${
      input.slice(endIndex)
    }`

    if (masked.length === input.length) return masked

    return `${additionalInfo}${masked}`
  } catch {
    return method(input)
  }
}

export const baseMask: BaseMaskingFunction = (input, method, { startAfter, endBefore } = {}) => {
  const originalLength = input.length
  const additionalInfo = `${input.length}${MASKING_SEPARATOR}`
  return masking(input, method, {
    startAfter,
    endBefore,
    additionalInfo,
    originalLength,
  })
}

export const baseUnmask: BaseMaskingFunction = (input, method, { startAfter, endBefore } = {}) => {
  if (input.includes(MASKING_SEPARATOR)) {
    const [length, value] = input.split(MASKING_SEPARATOR)

    const originalLength = Number(length)
    input = value
    return masking(input, method, { startAfter, endBefore, originalLength })
  }

  return method(input)
}
