import constants from 'modules/helpers/zanix/flags.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'

/**
 * `Deno lint` rule to validate the use of flags in the code for `Zanix Framework`.
 *
 * @see {@link constants.ZNX_FLAGS} for the more information of zanix flags.
 *
 * @description
 *
 * If an invalid flag is found, the following message will be shown:
 *
 *  `❌ The flag "foo-flag" is invalid.`
 *
 * The goal of this rule is to ensure that only predefined flags are used, helping maintain consistency
 * and avoid the use of incorrect or undefined flags in the code.
 */
const rules: Record<string, Deno.lint.Rule> = {
  'use-znx-flags': {
    create(context) {
      return {
        ExpressionStatement(node) {
          if (
            node.expression.type !== 'Literal' ||
            node.expression.range[0] !== 0
          ) return

          if (node.expression.value === null) return

          const flagName = node.expression.value.toString()

          if (constants.ZNX_FLAGS.includes(flagName)) return

          context.report({
            node,
            message: linterMessageFormat(`The flag "${flagName}" is invalid.`),
            hint: `Review available flags:\n ${constants.ZNX_FLAGS.join(', ')}`,
          })
        },
      }
    },
  },
}

export default rules
