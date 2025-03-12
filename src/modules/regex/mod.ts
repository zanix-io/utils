/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

import regex from 'utils/regex.ts'

/**
 * This module provides regular expressions used in the project.
 * Contains reusable patterns for validating data.
 *
 * @example
 *
 * ```typescript
 * import regex from 'jsr:@zanix/utils@[version]/regex'
 * ```
 *
 * @module zanixRegex
 */
export default Object.freeze(regex) as typeof regex
