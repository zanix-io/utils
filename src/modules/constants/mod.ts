/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

import * as constantsBaseModule from 'utils/constants.ts'

const constantsModule = { ...constantsBaseModule }
Object.assign(constantsModule, { default: undefined })

/**
 * This module provides constants used throughout the project.
 *
 * Includes static values that are reused across different parts of the code.
 *
 * @example
 *
 * ```typescript
 * import constants from 'jsr:@zanix/utils@[version]/constants'
 * ```
 *
 * @module zanixConstants
 */
const constants = Object.freeze(constantsModule) as Readonly<
  Omit<typeof constantsBaseModule, 'default'>
>
export default constants

export * from 'utils/constants.ts'
