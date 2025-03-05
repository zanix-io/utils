/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

/**
 * @module denoStdPlugin
 *
 * This module defines a linting plugin for Deno, which includes a set of custom rules
 * to improve code quality and follow best development practices.
 *
 * @example
 *
 * ```ts
 * import stdPlugin 'jsr:@zanix/utils@[version]/linter/deno-std-plugin'
 *
 * const diagnostics = Deno.lint.runPlugin(
 *   stdPlugin,
 *   'fileName.ts',
 *   `const fs = require('fs');`,
 * );
 * ```
 *
 * @see https://deno.land/
 */

import noRequire from 'linter/plugins/standard/rules/no-require.ts'
import noUselessExpression from './rules/no-useless-expression.ts'

/**
 * @name deno-std-plugin
 *
 * This linter plugin currently includes the following rules:
 * - `noUselessExpression`: Detects unnecessary expressions that have no side effects.
 * - `noRequire`: Prevents the use of `require` instead of `import` to maintain consistency with ES modules.
 */
const plugin: Deno.lint.Plugin = {
  name: 'deno-std-plugin',
  rules: {
    ...noUselessExpression,
    ...noRequire,
  },
}

export default plugin
