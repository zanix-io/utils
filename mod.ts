/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

import * as validator from 'modules/validations/mod.ts'

export * from 'modules/testing/mod.ts'
export * from 'modules/helpers/mod.ts'
export * from 'modules/workers/mod.ts'
export * from 'modules/errors/mod.ts'
export { default as constants } from 'modules/constants/mod.ts'
export { default as regex } from 'modules/regex/mod.ts'

export {
  /**
   * Validator module for BaseRTO-based requests.
   * This module provides basic validation decorators for string, array, and date types,
   * using native ECMAScript features compatible with Deno and Microsoft's Reflect Metadata API.
   * Validations are based on object extensions from BaseRTO.
   *
   * @module validator
   */
  validator,
}
