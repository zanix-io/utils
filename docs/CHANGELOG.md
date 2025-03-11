# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project
adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
