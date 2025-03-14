import { linterMessageFormat } from 'modules/linter/commons/message.ts'

/**
 * `Deno lint` rule to disallow the use of `require()` for loading modules.
 *
 * This rule prevents the usage of the CommonJS `require()` function to load modules.
 * Deno uses ES modules (ECMAScript Modules) by default, and `require()` is not supported
 * in Deno. Instead, modules should be imported using `import` statements.
 *
 * If a `require()` call is found, the rule will report an error message:
 *
 *  `❌ Don't use require() calls to load modules.`
 *
 * The goal of this rule is to enforce Deno's native module system, ensuring that
 * the code is compatible with Deno's ES module-based approach and eliminating
 * the use of incompatible CommonJS-style module loading.
 */
const rules: Record<string, Deno.lint.Rule> = {
  'no-require': {
    create(context) {
      return {
        'CallExpression[callee.name="require"]'(node) {
          context.report({
            node,
            message: linterMessageFormat("Don't use require() calls to load modules."),
            hint: 'Use `import` instead.',
          })
        },
      }
    },
  },
}

export default rules
