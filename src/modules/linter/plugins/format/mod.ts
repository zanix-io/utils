/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

/**
 * @module denoFormatPlugin
 *
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
 */

import singleQuote from './rules/single-quote.ts'
import lineWidth from './rules/line-width.ts'

/**
 * @name deno-fmt-plugin
 *
 * This linter plugin currently includes the following rules:
 * - {@link singleQuote}: Enforces the use of single quotes for string literals.
 * - {@link lineWidth}: Enforces a maximum line width for better readability.
 */
const plugin: Deno.lint.Plugin = {
  name: 'deno-fmt-plugin',
  rules: {
    ...singleQuote,
    ...lineWidth,
  },
}

export default plugin
