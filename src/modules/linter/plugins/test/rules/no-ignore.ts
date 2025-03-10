import { linterMessageFormat } from 'modules/linter/commons/message.ts'

/**
 * `Deno lint` rule to disallow the usage of `Deno.test.ignore` in the code.
 *
 * @description
 *
 * This rule checks for the usage of `Deno.test.ignore`, which is often used to run
 * ignore tests. While useful for development, it should not be present in the code
 * pushed to the repository to avoid unintentional test skipping.
 *
 * If `Deno.test.ignore` is found, the rule will report an error message:
 *
 *  `❌ Deno.test.ignore is not allowed.`
 *
 * The goal of this rule is to ensure that developers don't accidentally leave
 * test exclusions in the codebase, promoting a complete and consistent test suite.
 */

const rules: Record<string, Deno.lint.Rule> = {
  'no-ignore': {
    create(context) {
      return {
        'CallExpression[callee.object.object.name="Deno"][callee.object.property.name="test"][callee.property.name="ignore"]'(
          node,
        ) {
          context.report({
            node,
            message: linterMessageFormat('Deno.test.ignore is not allowed.'),
            hint: 'Please make sure not to ignore it',
          })
        },
      }
    },
  },
}

export default rules
