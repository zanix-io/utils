/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

import * as regexBaseModule from 'utils/regex.ts'

type RegexBaseModule = Omit<typeof regexBaseModule, 'default'>
type RegexModule = Readonly<RegexBaseModule>

const regexModule = { ...regexBaseModule }
Object.assign(regexModule, { default: undefined })

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
 * @see {@link regexBaseModule}
 *
 * @module zanixRegex
 */
const regex = regexModule as RegexModule
export default regex

export * from 'utils/regex.ts'
