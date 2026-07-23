/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

/**
 * Validator module for `BaseRTO`-based requests: validation decorators for strings, numbers,
 * dates, arrays, and enums, plus nested/custom validation and `classValidation`, all built on
 * native ECMAScript decorators (no `experimentalDecorators` or `reflect-metadata` needed).
 *
 * @module zanixValidator
 */

export * from './decorators/arrays/is-array.ts'
export * from './decorators/arrays/length.ts'

export * from './decorators/dates/is-date.ts'
export * from './decorators/dates/max-date.ts'
export * from './decorators/dates/min-date.ts'

export * from './decorators/numbers/is-number.ts'
export * from './decorators/numbers/max-number.ts'
export * from './decorators/numbers/min-number.ts'

export * from './decorators/strings/is-boolean-string.ts'
export * from './decorators/strings/is-email.ts'
export * from './decorators/strings/is-number-string.ts'
export * from './decorators/strings/is-phone.ts'
export * from './decorators/strings/is-string.ts'
export * from './decorators/strings/is-url.ts'
export * from './decorators/strings/is-uuid.ts'
export * from './decorators/strings/length.ts'
export * from './decorators/strings/match.ts'

export * from './decorators/generic/utils.ts'
export * from './decorators/generic/is-enum.ts'
export * from './decorators/generic/is-boolean.ts'

export * from './decorators/nested.ts'

export * from './base/rto.ts'

export * from './main.ts'

export { defineValidationDecorator } from './base/definitions/decorators.ts'
