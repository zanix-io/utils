/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

/**
 * @module denoTestPlugin
 *
 * This module defines a testing plugin for Deno, which includes some rules, such as
 * ensure that test cases do not contain `.only` to avoid accidentally running
 * only a subset of tests.
 *
 * @example
 *
 * ```ts
 * import testPlugin 'jsr:@zanix/utils@[version]/linter/deno-test-plugin'
 *
 * const diagnostics = Deno.lint.runPlugin(
 *   testPlugin,
 *   'fileName.ts',
 *   `Deno.test.only('test', () => {})`,
 * );
 * ```
 *
 * @see https://deno.com/
 */

import noOnly from './rules/no-only.ts'
import noIgnore from './rules/no-ignore.ts'

/**
 * @name deno-test-plugin
 *
 * This linter plugin currently includes the following rule:
 * - {@link noOnly}: Prevents the usage of `.only` in test functions (e.g., `Deno.test.only`),
 * - {@link noIgnore}: Prevents the usage of `.ignore` in test functions (e.g., `Deno.test.ignore`),
 *   which can be an accidental leftover when debugging tests.
 */
const plugin: Deno.lint.Plugin = {
  name: 'deno-test-plugin',
  rules: {
    ...noOnly,
    ...noIgnore,
  },
}

export default plugin
