/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

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
 * @see https://deno.land/
 */

import zanixFlags from './rules/zanix-flags.ts'
import formatPlugin from 'linter/plugins/format/mod.ts'
import standardPlugin from 'linter/plugins/standard/mod.ts'
import testPlugin from 'linter/plugins/test/mod.ts'

/**
 * @name deno-zanix-plugin
 *
 * This linter plugin includes rules from the following plugins:
 * - `zanixFlags`: A set of custom rules related to Zanix projects.
 * - `testPlugin`: A set of rules of `deno-test-plugin`.
 * - `standardPlugin`:  A set of rules of `deno-std-plugin`.
 * - `formatPlugin`:  A set of rules of `deno-fmt-plugin`.
 */
const plugin: Deno.lint.Plugin = {
  name: 'deno-zanix-plugin',
  rules: {
    ...zanixFlags,
    ...testPlugin.rules,
    ...standardPlugin.rules,
    ...formatPlugin.rules,
  },
}

export default plugin
