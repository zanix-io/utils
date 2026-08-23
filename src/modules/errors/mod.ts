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

// Explicit, not `export *` — `registerLogSink` (same file) is a module-private wiring seam that
// `modules/logger/mod.ts` calls directly via `modules/errors/main.ts`, never through this public
// barrel; it stays out of this production surface entirely (unlike `resetConfig` in
// `modules/helpers/mod.ts`, it has no test-only re-export either — nothing outside this package
// should ever call it).
export {
  ApplicationError,
  HttpError,
  HttpErrorBase,
  InternalError,
  PermissionDenied,
} from './main.ts'
export * from './serialize.ts'
export { DEFAULT_REDACT_PATTERN, setDefaultRedactOptions } from './redact.ts'
export type { RedactOptions } from 'typings/errors.ts'

export { default as httpStates } from './http-status-codes.ts'
