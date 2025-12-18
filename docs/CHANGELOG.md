# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project
adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
