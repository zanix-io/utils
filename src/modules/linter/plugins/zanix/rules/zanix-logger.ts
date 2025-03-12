import { linterMessageFormat } from 'modules/linter/commons/message.ts'

/**
 * `Deno lint` rule to validate the use of logger and console in `Zanix Framework`.
 *
 * @description
 *
 * If an invalid logger or console use is found, the following message will be shown:
 *
 *  `❌ Disallows the use of 'console'.`
 *
 * The purpose of this rule is to ensure that only the Zanix logger is used for logging,
 * maintaining consistency and better formatting.
 */
const rules: Record<string, Deno.lint.Rule> = {
  'no-znx-console': {
    create(context) {
      return {
        'CallExpression[callee.object.name="console"]'(node) {
          context.report({
            node,
            message: linterMessageFormat(`Disallows the use of 'console'.`),
            hint:
              `Please use the Zanix 'logger' module instead for consistent and properly formatted logging.`,
          })
        },
      }
    },
  },
}

export default rules
