/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

import * as testing from 'modules/testing/mod.ts'
import * as helpers from 'modules/helpers/mod.ts'
import * as workers from 'modules/workers/mod.ts'
import * as errors from 'modules/errors/mod.ts'
export { default as constants } from 'modules/constants/mod.ts'
export { default as regex } from 'modules/regex/mod.ts'

export {
  /**
   * @module zanixErrors
   * This module provides custom error handling utilities for the application.
   * It includes various error classes and constants that help manage and categorize
   * different types of errors that may occur in the system.
   */
  errors,
  /**
   * @module zanixHelpers
   *
   * This module provides utilities and functions for general tasks.
   *
   * Includes tools for file manipulation, string handling, etc.
   *
   * @example
   *
   * ```typescript
   * import { compileAndObfuscate } from 'jsr:@zanix/utils@[version]/helpers'
   * await compileAndObfuscate() // esbuild helper
   * ```
   */
  helpers,
  /**
   * @module zanixTesting
   *
   * This module provides utilities and functions for testing,
   * such as mocks and other test-related tools.
   *
   * These are used to simulate behaviors or states during testing.
   */
  testing,
  /**
   * @module zanixWorkers
   *
   * This module provides utilities for managing Web Workers using Deno Workers.
   * It includes the `TaskerManager` class, which facilitates the execution of tasks
   * in a separate thread using Deno's Worker API.
   */
  workers,
}
