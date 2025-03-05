/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

/**
 * @module zanixUtils
 *
 * This module provides the main linting plugin along with utilities designed
 * to streamline development and improve code quality in projects using the **Zanix** framework.
 *
 * It includes various utilities that can be used independently of the linting plugin,
 * such as helpers, constants, regular expressions, and Zanix-specific utilities.
 *
 * @example
 *
 * ```typescript
 * import { helpers } from 'jsr:@zanix/utils@[version]/mod.ts'
 * await helpers.compileAndObfuscate() // esbuild helper
 * ```
 */

import denoZanixPlugin from 'linter/plugins/zanix/mod.ts'
import { compileAndObfuscate } from 'utils/builder.ts'
import { fileExists } from 'utils/files.ts'
import { readConfig, writeConfig } from 'utils/config.ts'
import * as paths from 'utils/paths.ts'

/**
 * A collection of utility functions for Zanix, providing tools for file operations,
 * configuration management, and path handling.
 */
export const helpers = { compileAndObfuscate, fileExists, readConfig, writeConfig, ...paths }

export * as regexp from 'utils/regexp.ts'

export * as constants from 'utils/constants.ts'

export { getZanixPaths } from 'utils/zanix/projects.ts'

export default denoZanixPlugin
