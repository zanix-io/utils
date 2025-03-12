import { anyExtensionRegex, zanixScopeLib } from 'utils/regex.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'

/**
 * `Deno lint` rule to prevent explicit imports from `@zanix` modules with file extensions.
 *
 * @description
 *
 * This rule disallows the use of explicit file imports from any module within the `@zanix` scope
 * that include a file extension (e.g., `.ts`, `.js`, `.mjs`, etc.).
 *
 * If such an import is found, the following message will be shown:
 *
 *  `❌ Explicit imports from '@zanix' modules with file extensions are not allowed. Use the package imports instead.`
 *
 * The purpose of this rule is to ensure that users import the Zanix modules by their package names without
 * specifying file extensions, allowing for more flexible and consistent module usage (e.g., during compilation).
 */

const rules: Record<string, Deno.lint.Rule> = {
  'no-explicit-znx-imports': {
    create(context) {
      return {
        // Detect all import declarations
        'ImportDeclaration'(node) {
          // Get the import path
          const importPath = node.source.value

          // Check if the import path starts with '@zanix' and ends with any extension
          if (
            typeof importPath === 'string' && zanixScopeLib.test(importPath) &&
            anyExtensionRegex.test(importPath)
          ) {
            context.report({
              node,
              message: linterMessageFormat(
                `Explicit imports from '@zanix' modules with file extensions are not allowed. Use the package imports instead.`,
              ),
              hint:
                `Please avoid importing files from '@zanix' with extensions. Use the package name without the file extension (e.g., '@zanix/module').`,
            })
          }
        },
      }
    },
  },
}

export default rules
