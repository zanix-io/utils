/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

/**
 * General-purpose helpers for the Zanix ecosystem: config and path resolution, file utilities,
 * date/URL/encoding/network/casing/geo helpers, the Zanix namespace helper, cryptography
 * (encryption and masking), code-to-storage sync reconciliation (`planCodeSync`), and lazy
 * resolution of a conditional/optional dependency (`lazyFunction`/`lazyClass`/`lazyValue`).
 *
 * The `zanix new`/`zanix generate` project-tree scaffolding and `zanix prepare`'s GitHub/editor
 * scaffolding automation live in `@zanix/cli`, their only real consumer (verified
 * ecosystem-wide).
 *
 * @module zanixHelpers
 */

import { readConfig } from './config.ts'
import { registerConfigReader } from './zanix/namespace.ts'

export * from 'utils/identifiers.ts'
export * from 'utils/casing.ts'
export * from 'utils/dates.ts'
export * from 'utils/templates.ts'
export * from 'utils/concurrency.ts'
export * from 'utils/cron.ts'
export * from 'utils/routes.ts'
export * from 'utils/params.ts'
// Explicit, not `export *` — `registerConfigReader` (same file) is internal registration
// plumbing (see its own doc), wired up as an import-time side effect below; it stays out of this
// production surface the same way `resetConfig` (`./config.ts`, just below) does.
export { canUseZnx, getGlobalZnx, setGlobalZnx } from './zanix/namespace.ts'
export type { Zanix } from './zanix/namespace.ts'
export * from './paths.ts'
export * from './files.ts'
// Explicit, not `export *` — `resetConfig` (same file) is test-only and stays out of this
// production surface; it's re-exported from `@zanix/utils/testing` instead.
export { readConfig, readModuleConfig, saveConfig } from './config.ts'

// Registers the real `readConfig` as `./zanix/namespace.ts`'s own config reader — that file does
// not import `readConfig` directly itself (it reaches `@std/path`, and `namespace.ts` also
// sits in `createClientLogger`'s own module graph via `modules/logger/main.ts` — see
// `registerConfigReader`'s own doc, `./zanix/namespace.ts`, for the full reasoning). Every real
// consumer of `setGlobalZnx`/`Znx.config` via THIS barrel (`@zanix/utils/helpers`) picks up the
// real reader from here; `modules/logger/mod.ts` registers the same real function independently
// for its own consumers, since a logger-only consumer never loads this barrel at all.
registerConfigReader(readConfig)
export * from 'utils/urls.ts'
export * from 'utils/network.ts'
export * from 'utils/objects.ts'
export * from 'utils/geo.ts'
export * from 'utils/cookies.ts'
export * from 'utils/encoders.ts'
export * from './encryption/mod.ts'
export * from './masking/mod.ts'
export * from 'utils/ttl.ts'
export * from 'utils/timing.ts'
export * from 'utils/sync.ts'
export * from 'utils/lazy-import.ts'
export * from 'utils/runtime.ts'

// Exported only so the signatures of the helpers above resolve for `deno doc --lint`: the option,
// level and file shapes `readConfig`, `generateHash`, `generateRSAKeys`, `mask` and the like take
// or return. Use them to type your own values.
export type { ConfigFile } from 'typings/config.ts'
export type {
  AESLength,
  EncryptionLevel,
  HashAlgorithm,
  ValidRSAKeysOptions,
  ValidRSAModulusLength,
} from 'typings/encryption.ts'
export type {
  MaskingAlgorithms,
  MaskingBaseOptions,
  MaskingOptions,
  UnMaskingOptions,
} from 'typings/masking.ts'
export type { DefaultLogger, ZanixGlobal, ZanixProjects } from 'typings/zanix.ts'
// The class `DefaultLogger` (the type of `Znx.logger`) is an instance of, under the same name the
// `types` entrypoint and `@zanix/utils/logger` already give it. Type-only: nothing is imported.
export type { Logger as LoggerBase } from 'modules/logger/main.ts'
// And the types in that class's signatures, the same set `@zanix/utils/logger` exports.
export type {
  BaseFormattedLog,
  BaseMethods,
  Console as GlobalConsole,
  ConsoleInfo,
  ConsoleMethodFor,
  DefaultFormattedLog,
  DefaultResponse,
  LoggerData,
  LoggerLevel,
  LoggerMethods,
  LoggerTimer,
  LoggerTimerLevel,
  LoggerTimerOptions,
  SaveDataFile,
  SaveDataFunction,
} from 'typings/logger.ts'
export type { TaskCallback, TaskCallbackResponse } from 'typings/workers.ts'
