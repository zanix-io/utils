/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

import constants from 'utils/constants.ts'

import zanixFlags from 'modules/helpers/zanix/flags.ts'

/**
 * @module zanixConstants
 *
 * This module provides constants used throughout the project.
 *
 * Includes static values that are reused across different parts of the code.
 *
 * @example
 *
 * ```typescript
 * import constants from 'jsr:@zanix/utils@[version]/constants'
 * ```
 */
export default { ...constants, ...zanixFlags }
