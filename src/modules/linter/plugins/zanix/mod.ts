/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

import zanixFlags from './rules/zanix-flags.ts'
import zanixLogger from './rules/zanix-logger.ts'
import zanixImports from './rules/zanix-imports.ts'
import formatPlugin from '../format/mod.ts'
import standardPlugin from '../standard/mod.ts'
import testPlugin from '../test/mod.ts'

/**
 * Deno `Zanix` standard rules - linter plugin.
 *
 * This module defines a custom linting plugin for Deno that aggregates rules
 * from multiple plugins, providing a comprehensive set of linting checks
 * to improve code quality and ensure consistency across Zanix projects.
 *
 * @example
 *
 * ```ts
 * import zanixPlugin 'jsr:@zanix/utils@[version]'
 *
 * // use of Zanix project flags.
 * const diagnostics = Deno.lint.runPlugin(
 *   zanixPlugin,
 *   'fileName.ts',
 *   `'enablePipe:global'`,
 * );
 * ```
 * This linter plugin includes rules from the following plugins:
 * @see
 * - `zanixFlags`: A set of custom rules related to `Zanix` projects.
 * - `zanixLogger`: A set of custom rules related to `Zanix` logger.
 * - `zanixImports`: A set of custom rules related to `Zanix` imports.
 * - `testPlugin`: A set of rules of `deno-test-plugin`.
 * - `standardPlugin`:  A set of rules of `deno-std-plugin`.
 * - `formatPlugin`:  A set of rules of `deno-fmt-plugin`.
 *
 * @see https://deno.com/
 *
 * @name deno-zanix-plugin
 * @module denoZanixPlugin
 */
const plugin: Deno.lint.Plugin = {
  name: 'deno-zanix-plugin',
  rules: {
    ...zanixFlags,
    ...zanixLogger,
    ...zanixImports,
    ...testPlugin.rules,
    ...standardPlugin.rules,
    ...formatPlugin.rules,
  },
}
export default plugin
