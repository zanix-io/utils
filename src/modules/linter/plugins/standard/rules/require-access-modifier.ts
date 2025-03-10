import { linterMessageFormat } from 'modules/linter/commons/message.ts'

/**
 * `Deno lint` rule to ensures that all methods and properties inside a class have
 * an explicit access modifier (`public`, `private`, or `protected`).
 *
 * @description
 *
 * This helps enforce clarity in code by making the visibility of class members
 * clear and explicit. Without access modifiers, it may be unclear whether a
 * property or method is intended to be private, protected, or public.
 *
 * If such an error is found, the rule will report a message:
 *
 *  `❌ Methods/Properties should have an explicit access modifier (`public`, `private`, or `protected`).`
 *
 *  The goal of this rule is to enforce good encapsulation practices and to improve
 *  the readability and maintainability of the codebase by making access levels clear.
 */

const rules: Record<string, Deno.lint.Rule> = {
  'require-access-modifier': {
    create(context) {
      return {
        'MethodDefinition[accessibility=undefined]'(node: Deno.lint.MethodDefinition) {
          if (node.kind === 'constructor' || node.key.type === 'PrivateIdentifier') return
          context.report({
            node,
            message: linterMessageFormat(
              'Methods should have an explicit access modifier (public, private, protected).',
            ),
            hint: 'Add a public, private, or protected modifier to the method.',
          })
        },
        'PropertyDefinition[accessibility=undefined]'(node) {
          if (node.key.type === 'PrivateIdentifier') return
          context.report({
            node,
            message: linterMessageFormat(
              'Properties should have an explicit access modifier (public, private, protected).',
            ),
            hint: 'Add a public, private, or protected modifier to the property.',
          })
        },
      }
    },
  },
}

export default rules
