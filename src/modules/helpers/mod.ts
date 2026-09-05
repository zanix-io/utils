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
 * date/URL/encoding/network/casing helpers, the Zanix namespace helper, cryptography (encryption
 * and masking), code-to-storage sync reconciliation (`planCodeSync`), and lazy resolution of a
 * conditional/optional dependency (`lazyFunction`/`lazyClass`/`lazyValue`).
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
export * from 'utils/cookies.ts'
export * from 'utils/encoders.ts'
export * from './encryption/mod.ts'
export * from './masking/mod.ts'
export * from 'utils/ttl.ts'
export * from 'utils/sync.ts'
export * from 'utils/lazy-import.ts'
export * from 'utils/runtime.ts'
