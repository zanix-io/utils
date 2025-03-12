import { linterMessageFormat } from 'modules/linter/commons/message.ts'
import regex from 'utils/regex.ts'

/**
 * `Deno lint` rule to enforce the use of single quotes for string literals.
 *
 * This rule checks for string literals in the code and ensures they use single quotes (`'`)
 * instead of double quotes (`"`). Consistent use of single quotes improves readability and
 * follows certain style guidelines, especially for JavaScript/TypeScript code.
 *
 * If a string literal enclosed in double quotes is found, the rule will report an error message:
 *
 *  `❌ Use single quotes instead of double quotes.`
 *
 * The goal of this rule is to maintain a consistent code style where string literals
 * use single quotes for consistency and better readability.
 */

const rules: Record<string, Deno.lint.Rule> = {
  'single-quote': {
    create(context) {
      return {
        Literal(node) {
          if (typeof node.value !== 'string' || !regex.singleQuoteRegex.test(node.raw)) return
          context.report({
            node,
            message: linterMessageFormat('Use single quotes instead of double quotes.'),
            hint: 'Consider reviewing the formatting plugin.',
          })
        },
      }
    },
  },
}

export default rules
