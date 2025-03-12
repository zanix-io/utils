/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

import singleQuote from './rules/single-quote.ts'
import lineWidth from './rules/line-width.ts'

/**
 * Deno format linter plugin.
 *
 * This linter plugin currently includes the following rules:
 * - {@link singleQuote}: Enforces the use of single quotes for string literals.
 * - {@link lineWidth}: Enforces a maximum line width for better readability.
 *
 * @name deno-fmt-plugin
 */
const plugin: Deno.lint.Plugin = {
  name: 'deno-fmt-plugin',
  rules: {
    ...singleQuote,
    ...lineWidth,
  },
}

/**
 * This module defines a formatting plugin for Deno, which includes a set of custom rules
 * to enforce consistent code formatting styles.
 *
 * @example
 *
 * ```ts
 * import formatPlugin 'jsr:@zanix/utils@[version]/linter/deno-fmt-plugin'
 *
 * const diagnostics = Deno.lint.runPlugin(
 *   formatPlugin,
 *   'fileName.ts',
 *   `const fs = "double quote";`,
 * );
 * ```
 *
 * @see https://deno.com/
 *
 * @module denoFormatPlugin
 */
export default plugin
