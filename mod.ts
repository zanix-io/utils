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
 * This module provides utilities designed to streamline development
 * and improve code quality in projects using the **Zanix** framework.
 *
 * It includes various utilities such as helpers, constants, regular expressions,
 * and Zanix-specific utilities.
 *
 * @example
 *
 * ```typescript
 * import { getZanixPaths, helpers } from 'jsr:@zanix/utils@[version]'
 * getZanixPaths()
 * helpers.fileExists()
 * ```
 * @see
 * For more information about the available modules:
 * - {@link tests} - Utilities for testing (e.g., mocks, stubs).
 * - {@link helpers} - General-purpose utility functions.
 * - {@link constants} - Reusable constants used throughout the project.
 * - {@link regex} - Common regular expressions for data validation.
 */

// Zanix library module export

import * as testing from 'modules/testing/mod.ts'
import * as helpers from 'modules/helpers/mod.ts'
import * as workers from 'modules/workers/mod.ts'
import constants from 'modules/constants/mod.ts'
import regex from 'modules/regex/mod.ts'

export {
  /** @see {@link constants} */
  constants,
  /** @see {@link helpers} */
  helpers,
  /** @see {@link regex} */
  regex,
  /** @see {@link testing} */
  testing,
  /** @see {@link workers} */
  workers,
}
