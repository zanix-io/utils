/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

/**
 * Custom error classes (`HttpError`, `ApplicationError`, `InternalError`, `PermissionDenied`),
 * HTTP status code mapping (`httpStates`), and error serialization helpers.
 *
 * @module zanixErrors
 */

export * from './main.ts'
export * from './serialize.ts'
export { DEFAULT_REDACT_PATTERN, setDefaultRedactOptions } from './redact.ts'
export type { RedactOptions } from 'typings/errors.ts'

export { default as httpStates } from './http-status-codes.ts'
