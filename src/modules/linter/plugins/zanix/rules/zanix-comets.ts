import { linterMessageFormat } from 'modules/linter/commons/message.ts'

const SPACE_COMET_SOURCE = '@zanix/space/comet'
const DEFINE_COMET_IMPORT_NAME = 'defineComet'

/**
 * The local name bound to a named import of `defineComet` from `@zanix/space/comet` in this file,
 * if any (accounting for `import { defineComet as define } from '@zanix/space/comet'`-style
 * aliasing). `undefined` when this file never imports it at all — i.e. isn't a comet file — the
 * same "never assume, always resolve the real import" precedent `no-invalid-znx-cookie-name`'s own
 * `collectSpaceCookieGuardImports` already established.
 */
function findDefineCometLocal(program: Deno.lint.Program): string | undefined {
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration' || statement.source.value !== SPACE_COMET_SOURCE) {
      continue
    }

    for (const specifier of statement.specifiers) {
      if (specifier.type !== 'ImportSpecifier') continue

      const importedName = specifier.imported.type === 'Identifier'
        ? specifier.imported.name
        : specifier.imported.value

      if (importedName === DEFINE_COMET_IMPORT_NAME) return specifier.local.name
    }
  }

  return undefined
}

/**
 * A top-level `FunctionDeclaration` (`function X() {}`) or `VariableDeclaration`
 * (`const X = () => {}`/`const X = function () {}`) named `name`, declared directly in `body` —
 * but only in its BARE (not already `export`-wrapped) form. `Program.body` never contains a bare
 * `FunctionDeclaration`/`VariableDeclaration` for a name that's declared as `export function X`/
 * `export const X` instead — that shows up as an `ExportNamedDeclaration` wrapping it, a different
 * node the caller never asks this function about, since it never needs fixing.
 *
 * Returns `undefined` when `name` isn't declared this way at all in this file (already exported,
 * imported from elsewhere, a function parameter, ...) — deliberately conservative, matching
 * `no-invalid-znx-cookie-name`'s own documented "false-negative-safe over false-positive-risky"
 * posture: this rule would rather miss a real violation it can't confidently resolve than flag one
 * that isn't real.
 */
function findUnexportedTopLevelDeclaration(
  body: Deno.lint.Program['body'],
  name: string,
): Deno.lint.FunctionDeclaration | Deno.lint.VariableDeclaration | undefined {
  for (const statement of body) {
    if (statement.type === 'FunctionDeclaration' && statement.id?.name === name) {
      return statement
    }

    if (statement.type === 'VariableDeclaration') {
      const matches = statement.declarations.some(
        (declarator) => declarator.id.type === 'Identifier' && declarator.id.name === name,
      )
      if (matches) return statement
    }
  }

  return undefined
}

/**
 * Whether `name` is re-exported via a separate, later `export { name }` statement — the one other
 * legitimate way a bare (not `export`-wrapped) top-level declaration ends up actually exported from
 * this file. Only counts a LOCAL re-export (no `from '...'` source on the `export` statement itself)
 * — an `export { name } from './other.ts'` re-exports some OTHER module's `name`, never this file's
 * own local declaration, so it would never be what the client's `module[exportName]` lookup finds.
 */
function isReExported(body: Deno.lint.Program['body'], name: string): boolean {
  for (const statement of body) {
    if (statement.type !== 'ExportNamedDeclaration' || statement.declaration || statement.source) {
      continue
    }

    for (const specifier of statement.specifiers) {
      if (specifier.local.type === 'Identifier' && specifier.local.name === name) return true
    }
  }

  return false
}

/**
 * `Deno lint` rule to catch a `@zanix/space` Comet component passed to `defineComet` that's a
 * NAMED function/const but never actually EXPORTED from the same file.
 *
 * `defineComet(Component, sourceUrl)` reads `Component.name` at runtime to know which export the
 * client should grab after dynamically importing this same module (see that function's own doc).
 * `defineComet` already throws, at module-eval time, when `Component` has no name at all (an
 * anonymous function) — but a NAMED function that's simply missing its own `export` keyword
 * compiles and lints cleanly today under `deno check`/plain `deno lint`, and only fails client-side,
 * at hydration, with `Error: Element type is invalid: expected a string... but got: undefined` — no
 * indication anywhere that a missing `export` was the cause. This rule catches that gap at lint
 * time instead, before it ever reaches a browser.
 *
 * If a comet component is declared but not exported, the following message is shown:
 *
 *  `❌ Comet component "Counter" is declared but not exported — defineComet reads Component.name at
 *  runtime, and the client looks it up as a named export of this same module after a dynamic
 *  import.`
 *
 * Auto-fixable via `deno lint --fix`: inserts `export ` immediately before the matched
 * `function`/`const` declaration.
 *
 * Only flags a call confirmed, in the same file, to resolve to a real `defineComet` import from
 * `@zanix/space/comet` (never a same-named local function — the same "never assume, always resolve
 * the real import" discipline `no-znx-console`/`no-invalid-znx-cookie-name` already established),
 * and only when the first argument is a plain `Identifier` resolving to a top-level
 * `FunctionDeclaration`/`VariableDeclaration` in this same file. An inline function expression, a
 * spread, an identifier this rule can't resolve to a same-file top-level declaration (imported from
 * elsewhere, a parameter, ...), or a declaration already exported (directly or via a later
 * `export { X }`) is never flagged — false-negative-safe over false-positive-risky, the same
 * documented posture `no-invalid-znx-cookie-name` already follows.
 */
const rules: Record<string, Deno.lint.Rule> = {
  'no-unexported-comet-component': {
    create(context) {
      // Resolved lazily on the first `defineComet(...)`-shaped call actually found in this file,
      // then cached — a file with more than one `defineComet` call (unusual, but not this rule's
      // job to forbid) only walks its own imports once.
      let defineCometLocal: string | undefined | null = null

      return {
        'CallExpression[callee.type="Identifier"]'(node) {
          if (defineCometLocal === null) {
            defineCometLocal = findDefineCometLocal(context.sourceCode.ast) ?? undefined
          }
          if (!defineCometLocal) return

          const callee = node.callee as Deno.lint.Identifier
          if (callee.name !== defineCometLocal) return

          const componentArg = node.arguments[0]
          if (!componentArg || componentArg.type !== 'Identifier') return

          const name = componentArg.name
          const declaration = findUnexportedTopLevelDeclaration(context.sourceCode.ast.body, name)
          if (!declaration) return

          if (isReExported(context.sourceCode.ast.body, name)) return

          context.report({
            node: componentArg,
            message: linterMessageFormat(
              `Comet component "${name}" is declared but not exported — defineComet reads ` +
                `Component.name at runtime, and the client looks it up as a named export of this ` +
                `same module after a dynamic import.`,
            ),
            hint: `Add "export" to its declaration (e.g. "export function ${name}(...) {}") — an ` +
              `unexported named component compiles and lints cleanly today, then crashes client-side ` +
              `at hydration with "Element type is invalid: expected a string... but got: undefined".`,
            fix(fixer) {
              const start = declaration.range[0]
              return fixer.insertTextBeforeRange([start, start], 'export ')
            },
          })
        },
      }
    },
  },
}

export default rules
