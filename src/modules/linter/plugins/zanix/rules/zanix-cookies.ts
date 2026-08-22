import regex from 'utils/regex.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'

/**
 * `@zanix/space` guard factories whose options accept a customizable `cookieName` — the same set
 * `assertZnxCookieName` (`@zanix/utils`'s own runtime counterpart to this rule) is meant to be
 * called from.
 */
const SPACE_COOKIE_GUARDS = new Set(['csrfGuard', 'langGuard', 'langPreHandler', 'populationGuard'])
const SPACE_PACKAGE_SOURCE = '@zanix/space'
const CSRF_GUARD_NAME = 'csrfGuard'
const CSRF_KEYWORD = 'Csrf'

/**
 * Maps every local identifier this file binds, via a named import from `@zanix/space`, to one of
 * {@linkcode SPACE_COOKIE_GUARDS} — to its real imported name (accounting for `import { csrfGuard
 * as guard } from '@zanix/space'`-style aliasing).
 *
 * Deliberately conservative: a bare call-site name match (e.g. any local `function csrfGuard(...)`)
 * is NOT enough to flag — only a call confirmed, in the same file, to resolve to a real
 * `@zanix/space` import is considered. This mirrors `no-znx-console`'s own "never assume, always
 * resolve the real import" precedent, trading a (documented) false negative on a re-exported or
 * indirectly-imported guard for zero false positives on an unrelated same-named local function.
 */
function collectSpaceCookieGuardImports(program: Deno.lint.Program): Map<string, string> {
  const locals = new Map<string, string>()

  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration' || statement.source.value !== SPACE_PACKAGE_SOURCE) {
      continue
    }

    for (const specifier of statement.specifiers) {
      if (specifier.type !== 'ImportSpecifier') continue

      const importedName = specifier.imported.type === 'Identifier'
        ? specifier.imported.name
        : specifier.imported.value

      if (SPACE_COOKIE_GUARDS.has(importedName)) {
        locals.set(specifier.local.name, importedName)
      }
    }
  }

  return locals
}

/**
 * The `cookieName` property of an options object literal, if it has one with a plain (non-computed)
 * key — either `{ cookieName: ... }` or `{ 'cookieName': ... }`.
 */
function findCookieNameProperty(
  properties: Deno.lint.ObjectExpression['properties'],
): Deno.lint.Property | undefined {
  for (const property of properties) {
    if (property.type !== 'Property' || property.computed) continue

    const key = property.key
    const keyName = key.type === 'Identifier'
      ? key.name
      : key.type === 'Literal' && typeof key.value === 'string'
      ? key.value
      : undefined

    if (keyName === 'cookieName') return property
  }

  return undefined
}

/**
 * `Deno lint` rule to validate a LITERAL `cookieName` passed to one of `@zanix/space`'s
 * `csrfGuard`/`langGuard`/`langPreHandler`/`populationGuard` guard factories against the
 * ecosystem-wide framework-cookie convention: every framework-owned HTTP cookie must be named
 * `X-Znx-<PascalCase>-...`.
 *
 * This is the lint-time, earlier-feedback counterpart to `@zanix/utils`'s own runtime
 * `assertZnxCookieName` — it catches the common case (a plain string literal) before the code ever
 * runs, but can never replace the runtime check: a dynamically-computed `cookieName` value (a
 * variable, a template expression, a function call, ...) is invisible to a lint rule and is always
 * silently skipped here.
 *
 * If a literal `cookieName` doesn't start with `X-Znx-`, the following message is shown (regardless
 * of which of the four guards it's passed to):
 *
 *  `❌ Cookie name "session" for 'csrfGuard' must start with "X-Znx-".`
 *
 * `@zanix/server`'s own `cookiesGuard` silently drops any cookie outside that prefix from
 * `ctx.cookies` before any guard/handler ever runs — no error, no warning — so a misnamed cookie
 * becomes invisible in production instead of failing loudly where the mistake was actually made.
 *
 * For `csrfGuard` specifically, a literal that starts with `X-Znx-` but doesn't also contain
 * `Csrf` (case-insensitive) is flagged too, with:
 *
 *  `❌ Cookie name "X-Znx-Token" for 'csrfGuard' must contain "Csrf" (case-insensitive).`
 *
 * `@zanix/utils`'s own sensitive-key redaction pattern recognizes a CSRF cookie by that keyword in
 * its name — a customized name dropping it would silently stop being redacted from logs.
 * `langGuard`/`langPreHandler`/`populationGuard` don't carry this second check: their cookies
 * aren't in the redaction-sensitive set.
 *
 * Only flags a call confirmed, in the same file, to be a named import from `@zanix/space` — an
 * unrelated local function sharing one of these four names is never flagged (see
 * {@linkcode collectSpaceCookieGuardImports}).
 */
const rules: Record<string, Deno.lint.Rule> = {
  'no-invalid-znx-cookie-name': {
    create(context) {
      // Resolved lazily on the first call to any of the four guard names actually found in this
      // file, then cached — a file calling several of them only walks its own imports once.
      let guardLocals: Map<string, string> | undefined

      return {
        'CallExpression[callee.type="Identifier"]'(node) {
          if (guardLocals === undefined) {
            guardLocals = collectSpaceCookieGuardImports(context.sourceCode.ast)
          }

          const callee = node.callee as Deno.lint.Identifier
          const importedName = guardLocals.get(callee.name)
          if (!importedName) return

          const optionsArg = node.arguments[0]
          if (!optionsArg || optionsArg.type !== 'ObjectExpression') return

          const cookieNameProperty = findCookieNameProperty(optionsArg.properties)
          if (!cookieNameProperty) return

          const valueNode = cookieNameProperty.value
          // Only a plain string literal can be evaluated at lint time — anything computed
          // (a variable, a template expression, a function call, ...) is the runtime
          // `assertZnxCookieName` check's job, not this rule's.
          if (valueNode.type !== 'Literal' || typeof valueNode.value !== 'string') return

          const cookieName = valueNode.value

          if (!regex.ZNX_COOKIE_PREFIX_REGEX.test(cookieName)) {
            context.report({
              node: valueNode,
              message: linterMessageFormat(
                `Cookie name "${cookieName}" for '${importedName}' must start with "X-Znx-".`,
              ),
              hint:
                `@zanix/server's cookiesGuard silently drops any cookie outside the "X-Znx-" prefix from ctx.cookies before any guard/handler runs — rename it to e.g. "X-Znx-${cookieName}".`,
            })
            return
          }

          if (
            importedName === CSRF_GUARD_NAME &&
            !cookieName.toLowerCase().includes(CSRF_KEYWORD.toLowerCase())
          ) {
            context.report({
              node: valueNode,
              message: linterMessageFormat(
                `Cookie name "${cookieName}" for '${CSRF_GUARD_NAME}' must contain "${CSRF_KEYWORD}" (case-insensitive).`,
              ),
              hint:
                `@zanix/utils's sensitive-key redaction pattern recognizes a CSRF cookie by the "${CSRF_KEYWORD}" keyword in its name — a customized name dropping it would silently stop being redacted from logs.`,
            })
          }
        },
      }
    },
  },
}

export default rules
