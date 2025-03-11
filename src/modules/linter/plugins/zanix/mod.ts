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
import formatPlugin from '../format/mod.ts'
import standardPlugin from '../standard/mod.ts'
import testPlugin from '../test/mod.ts'

/**
 * @name deno-zanix-plugin
 *
 * This linter plugin includes rules from the following plugins:
 * - {@link zanixFlags}: A set of custom rules related to Zanix projects.
 * - {@link testPlugin}: A set of rules of `deno-test-plugin`.
 * - {@link standardPlugin}:  A set of rules of `deno-std-plugin`.
 * - {@link formatPlugin}:  A set of rules of `deno-fmt-plugin`.
 */
const plugin: Deno.lint.Plugin = {
  name: 'deno-zanix-plugin',
  rules: {
    ...zanixFlags,
    ...zanixLogger,
    ...testPlugin.rules,
    ...standardPlugin.rules,
    ...formatPlugin.rules,
  },
}

/**
 * @module denoZanixPlugin
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
 *
 * @see https://deno.com/
 */
export default plugin
