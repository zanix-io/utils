import { linterMessageFormat } from 'modules/linter/commons/message.ts'

/**
 * `Deno lint` rule to disallow useless expressions in the code.
 *
 * This rule detects expressions that are unnecessary and have no effect on the code's behavior.
 * These expressions typically occur when a literal value is written on its own, without being
 * assigned, returned, or used in any meaningful way.
 *
 * If such an expression is found, the rule will report an error message:
 *
 *  `❌ Unnecessary expression.`
 *
 * The goal of this rule is to help clean up the code by removing redundant expressions
 * that do not contribute to the logic, improving code readability and maintainability.
 */
const rules: Record<string, Deno.lint.Rule> = {
  'no-useless-expression': {
    create(context) {
      return {
        ExpressionStatement(node) {
          const expression = node.expression
          const range = expression.range

          const report = expression.type === 'SequenceExpression' ||
            expression.type === 'Literal' && range[0] !== 0 ||
            expression.type === 'CallExpression' &&
              expression.callee.type === 'FunctionExpression' ||
            expression.type === 'LogicalExpression' ||
            expression.type === 'TaggedTemplateExpression' &&
              expression.tag.type === 'Identifier' &&
              expression.tag.name === 'injectGlobal'

          if (report) {
            context.report({
              node,
              message: linterMessageFormat('Unnecessary expression.'),
              hint: 'Remove it as it has no effect on the code.',
            })
          }
        },
      }
    },
  },
}

export default rules
