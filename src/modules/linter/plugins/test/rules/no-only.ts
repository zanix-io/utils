import { linterMessageFormat } from 'modules/linter/commons/message.ts'

/**
 * `Deno lint` rule to disallow the usage of `Deno.test.only` in the code.
 *
 * @description
 *
 * This rule checks for the usage of `Deno.test.only`, which is often used to run
 * a single test while skipping others. While useful for development, it should
 * not be present in the code pushed to the repository to avoid unintentional test skipping.
 *
 * If `Deno.test.only` is found, the rule will report an error message:
 *
 *  `❌ Deno.test.only is not allowed.`
 *
 * The goal of this rule is to ensure that developers don't accidentally leave
 * test exclusions in the codebase, promoting a complete and consistent test suite.
 */

const rules: Record<string, Deno.lint.Rule> = {
  'no-only': {
    create(context) {
      return {
        'CallExpression[callee.object.object.name="Deno"][callee.object.property.name="test"][callee.property.name="only"]'(
          node,
        ) {
          context.report({
            node,
            message: linterMessageFormat('Deno.test.only is not allowed.'),
            hint: 'Please remove no only condition.',
          })
        },
      }
    },
  },
}

export default rules
