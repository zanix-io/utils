# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project
adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.4.2] - 2026-07-26

### Added

- Re-exported `LoggerOptions`, `LoggerFunctionOptions`, `LoggerFileOptions`,
  `SaveDataFunctionOptions`, `SaveDataFile`, and `SaveDataFileOptions` from `@zanix/utils/types` —
  previously internal-only types needed to annotate a custom `Logger` `storage.save` factory's
  return type without reaching into `@zanix/utils`'s own internals.
- Documented a sixth `Logger` storage style in [docs/logger.md](docs/logger.md#6-building-a-reusable-storage-backend):
  packaging a reusable storage backend as a factory function that returns a `SaveDataFunction`
  (e.g. `@zanix/datamaster`'s `elasticsearchLogSave`), plus guidance on aliasing the default
  formatter's `timestamp` field to a backend-specific convention (e.g. Elastic Common Schema's
  `@timestamp`) instead of synthesizing a new one.

## [2.4.1] - 2026-07-26

### Added

- Added `planCodeSync`, a storage-agnostic helper for reconciling code-defined entries with persisted records while preserving manual edits. Introduced the accompanying `StaticSyncEntry`, `PersistedSyncEntry`, and `SyncPlan` helper types for reusable code-to-storage synchronization logic.

## [2.4.0] - 2026-07-25

### Added

- `base32Encode`/`base32Decode`: RFC 4648 Base32 codec (uppercase `A-Z2-7` alphabet, unpadded
  encode, lowercase/padding-tolerant decode) — the format authenticator-app secrets (TOTP) are
  conventionally shown in.
- `signHMACBytes`: a raw-bytes HMAC helper supporting the full `HashAlgorithm` range, including
  `'SHA-1'`, which `signHMAC` deliberately excludes (JWT has no HS1 algorithm). Takes the key and
  data as `Uint8Array` instead of `signHMAC`'s UTF-8 `string`, since round-tripping an arbitrary
  binary key through a JS string would corrupt bytes ≥128.
- `interpolateEnv`: resolves `${{ENV_VAR}}` placeholders against `Deno.env`, recursing into
  arrays/objects the same way `interpolate` does. A separate convention from `interpolate`'s
  `{{field}}` so both can coexist in the same string — an unset variable is substituted as the
  literal text `'undefined'` rather than throwing.

### Changed

- `interpolate`: no longer matches `{{...}}` when immediately preceded by `$`, so `${{ENV_VAR}}`
  placeholders are left untouched for `interpolateEnv` to resolve instead of being treated as
  `interpolate`'s own field syntax.
- `cleanRoute`: Added the `keepCase` option to preserve the original route casing during normalization.

## [2.3.0] - 2026-07-24

### Added

- `toSearchParams`: builds a `URLSearchParams` from a plain object — the reverse direction of
  `getProcessedParams`, using the same array/nested-object conventions so the two round-trip.
- `interpolateUrl`: interpolates `{{field}}`/`{{nested.path}}` placeholders in a URL template. The
  path portion is interpolated as plain text; a query value that is exactly one placeholder is
  expanded via `toSearchParams` (arrays become repeated keys, nested objects use bracket notation)
  instead of being stringified.
- New template-interpolation primitives (`getPath`, `matchWholePlaceholder`, `interpolate`) for
  resolving `{{field}}`/`{{nested.path}}` placeholders against a record — the building blocks
  behind `interpolateUrl`, also usable standalone.
- `Semaphore` and `LockManager`: concurrency primitives for limiting simultaneous access to a
  resource (fixed permit count) and for exclusive per-key locking.
- `nextCronDate`: computes the next execution `Date` matching a 6-field cron expression
  (`second minute hour day month weekday`).
- `cleanRoute`: normalizes a route path (backslashes, repeated slashes, whitespace, casing).
- `processUrlParams`: recursively `decodeURIComponent`s every string value inside an object or
  array, in place.

## [2.2.17] - 2026-07-23

### Fixed

- Restored the `@module` tag on the `validator` re-export in `mod.ts` (removed by mistake in
  2.2.16): the fix for JSR's Overview tab showing that comment instead of `README.md` is the
  package's "Readme Source" setting on jsr.io, not removing the module doc — removing it broke
  the "Has module docs in all entrypoints" score item instead.
- Added the missing `@module` tag (with a real summary) to the 7 entrypoints that never had one:
  `/helpers`, `/validator`, `/logger`, `/testing`, `/workers`, `/errors`, and `/types`, so every
  entrypoint declared in `deno.jsonc`'s `exports` now satisfies JSR's module-doc score check.

## [2.2.16] - 2026-07-23

### Fixed

- Removed the `@module` tag from the `validator` re-export in `mod.ts`: JSR's package Overview
  page prioritizes a `@module`-tagged doc comment on the main entrypoint over the actual
  `README.md`, which made the Overview show that comment's text instead of the real README.
- Bumped `actions/checkout` (`v4` → `v5`) and `denoland/setup-deno` (`v1` → `v2`) in the publish
  workflow and its scaffolding template (`publish.base.yml`), resolving a Node.js 20 deprecation
  warning on GitHub Actions runners.

### Changed

- Documented the remaining undocumented private fields on `WorkerManager` (`workers`, `#tasks`,
  `#workerIx`) and replaced a placeholder comment on `HttpError`/`ApplicationError`'s `_logged`
  field with a description of its actual purpose (de-duplicating repeated logs of the same error).

## [2.2.15] - 2026-07-23

### Added

- Full public type coverage for the `/types` entrypoint: ~35 previously-internal types are now
  exported and documented, resolving all `deno doc --lint` `private-type-ref` errors (except a
  documented exception for the third-party `esbuild` `BuildOptions`/`Plugin` types).
- `IsBooleanString`/`isBooleanString`/`isBooleanStringArray` are now exported from the `/validator`
  entrypoint (the decorator existed but was unreachable from outside the package).
- Complete documentation set under `docs/`: validator, helpers, utils, encryption & masking,
  logger, workers, errors, linter plugins, and a full types reference, each cross-linked and with
  runnable examples verified against the real implementation.
- Expanded test coverage (branch, function, and line) across validation decorators, GitHub/editor
  helpers, config, masking, and worker/project-tree caching.

### Fixed

- `getAppSrcTree`/`getServerSrcTree`/`getCommonTree` memoization never actually cached anything (a
  missing assignment), so the full Zanix folder tree was rebuilt on every call instead of reusing
  the cached one.
- `createPreCommitYaml` was missing an `await`, letting `pre-commit install`/`autoupdate` run
  before the `.pre-commit-config.yaml` file had finished being written.
- The `Zanix`/`DefaultLogger` type aliases depended on an ambient global that JSR's slow-types
  checker cannot resolve, which made `deno publish` fail outright.
- Corrected several outdated JSDoc comments across `errors`, `workers`, `encryption`, GitHub
  helpers, and linter plugins: wrong option defaults, swapped RSA public/private key descriptions,
  descriptions copied from a sibling symbol without updating them, and a reference to a
  `zanixFlags` rule that no longer exists.

### Removed

- `src/modules/helpers/environment.ts` and `src/modules/helpers/zanix/flags.ts` — orphaned files
  with no consumers.

## [2.2.14] - 2025-12-19

### Added

- Worker task modules are now cached after the first import, avoiding a redundant dynamic import
  on every subsequent call to the same task.

## [2.2.13] - 2025-12-17

### Added

- Worker manager pool for efficient worker management and reuse

## [2.2.12] - 2025-12-07

### Fixed

- Fixed an issue with the number transformation validation.

## [2.2.7] - 2025-11-24

### Added

- Introduced a new validation decorator.

## [2.2.6] - 2025-11-19

### Added

- **Private fields support in error classes**: Errors now support private fields, including a new `_logged` field, to improve error tracking and management. This allows better control over whether an error has been logged, preventing duplicate logs.

- **`ApplicationError` class enhancement**: The `ApplicationError` class has been extended to include additional flexibility, improving the structure for handling application-level errors. This allows custom errors to integrate seamlessly with error logging systems and better track error states.

### Changed

- Updated internal error classes to make use of private fields for tracking error states more effectively.
- Serialized errors can now include or exclude the stack trace based on the user's selection.

## [2.2.4] - 2025-11-19

### Changed

- Replaced Higher-Order Component (HOC) files with `defs` files to unify module definitions and centralize DSL-based declarations, metadata, and foundational structures. This improves consistency and simplifies the architecture for components like handlers, interactors, providers, and connectors.

## [2.2.3] - 2025-11-17

### Added

- **New helper TTL**: Introduced helper for parsing TTL.

## [2.2.2] - 2025-11-15

### Changed

- Obfuscator dependencies

## [2.2.1] - 2025-11-14

### Added

- **New asymmetric HMAC signing**: Introduced support for asymmetric HMAC signing, allowing for enhanced security with keys for signature generation and verification.

- **New error handling**: Introduced new custom error types for better error
  management.

### Changed

- **AES Encryption**: Added support for generating AES keys and performing AES encryption with any key type.

## [2.2.0] - 2025-11-05

### Changed

- `TaskerManager` has been replaced with the new `WorkerManager`, providing an improved API and extended usage options.

### Added

- Support for different worker execution modes (e.g., auto-closing, background execution).
- Simplified task invocation with new helper methods.
- Improved error handling and lifecycle management for worker tasks.

## [2.1.10] - 2025-11-02

### Fixed

- Validate after unmasking

## [2.1.9] - 2025-11-02

### Fixed

- Hashing vulnerability

## [2.1.8] - 2025-11-01

### Added

- Internal code and meta options to httpError
- Internal error class
- Error types

### Fixed

- encrypt and mask generic types

## [2.1.7] - 2025-10-26

### Changed

- UUID basic reeplaced by v4

## [2.1.6] - 2025-10-24

### Changed

- Encryption keys to use string keys allways

## [2.1.5] - 2025-10-20

### Added

- Symmetric and asymmetric encryption.
- Masking.
- Unidirectional encryption.
- Signing.

## [2.1.4] - 2025-10-17

### Fixed

- Github configuration helpers

## [2.1.3] - 2025-10-16

### Fixed

- Pre commit types

## [2.1.2] - 2025-10-16

### Fixed

- Read config file from jsonc

### Added

- Pre commit framework support

## [2.1.1] - 2025-04-11

### Added

- Recursive file reader function `collectFiles`.
- Generate hash helper `generateHashHex`.

### Fixed

- Format linter Max line width for string templates.
- RTO types.

### Removed

- Zanix Flags constants.
- Zanix Flags linter rules.

## [2.1.0] - 2025-03-26

### Added

- Class validation module. A Validations module for BaseRTO-based requests, using native ECMAScript features.

## [2.0.9] - 2025-03-20

### Added

- HttpError id props for trazability.

### Fixed

- Serialized error causes.

### Removed

- Remove Serialized errors for production environment.

## [2.0.8] - 2025-03-18

### Fixed

- Serialized errors for production environment.
- Correct Github initialization on helper.

## [2.0.7] - 2025-03-18

### Added

- New github, editor and workflow helper options.

### Fixed

- Github helper creation file validation when exists.

## [2.0.6] - 2025-03-17

### Added

- `readModuleConfig` for specifics modules (local or remotes).

## [2.0.5] - 2025-03-17

### Fixed

- Zanix namespace definition without config file.

## [2.0.4] - 2025-03-17

### Fixed

- Esbuild npm external libraries compatibility
- Zanix templates content for different startingpoint.

## [2.0.3] - 2025-03-16

### Added

- Template content for Zanix files tree.

### Fixed

- Zanix paths, and `regex` y `constants` documentation.
- Znx initialization.
- Format linter line-width for imports.
- Esbuild options and plugins for default modules and

## [2.0.2] - 2025-03-13

### Added

- Some documentation.
- New constants.
- New regexps.
- New Zanix utilities, for Zanix Framework purposes.

### Changed

- Exported modules on `constants` and `regex`
- Zanix Tree update for `Zanix` libraries.

## [2.0.1] - 2025-03-12

### Fixed

- Some documentation
- `getZanixPaths` helper to allows custom root dir.
- Lint stagged file patterns

## [2.0.0] - 2025-03-11

### Added

- `Types` module.

### Changed

- Several Zanix utilities have been removed and migrated to @zanix/cli.
- Main module exports have been updated.

### Fixed

- Read file from current URL on `createPreCommitHook`, `createPrePushHook`, `createPublishWorkflow` and `createIgnoreBaseFile`

## [1.1.0] - 2025-03-10

### Added

- `Errors` module: Custom `HttpErrors` and utility functions.
- GitHub Actions and helpers to automate the creation of hooks.
- Editor helpers to automate the creation of settings.

### Fixed

- Some default documentation.
- Logger default instance to get previous global instance.

## [1.0.0] - 2025-03-09

### Added

- A logger module.
- A testing module for mocks.
- A workers module for using basic taskers.
- Comprehensive documentation for the `Zanix Utils` library.
- Export of existing modules, making them usable both within and outside the Zanix ecosystem.
- Unit tests to ensure the library's functionality and reliability.
- New `require-access-modifier` rule added to `deno-std-plugin`.
- New `no-znx-console` rule added to `deno-zanix-plugin`, similar to `no-console`.
- `Zanix` namespace for global use in modules and types.

### Changed

- Renamed the plugin `deno-standard-plugin` to `deno-std-plugin`.
- Enabled the `deno-zanix-plugin` as a separate module.
- Renamed some flags in the `use-znx-flags` validation rule of `deno-zanix-plugin`.

### Fixed

- Fixed some issues in `deno-fmt-plugin`.

## [0.1.0] - 2025-03-04

### Initial Release

- First version of `Zanix Utils`.
- Provides linting rules and utilities to improve code quality in projects using the Zanix
  framework.
