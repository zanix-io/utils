import { dirname, resolve as resolvePath } from '@std/path'
import { stripComments } from 'utils/encoders.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'

/**
 * `console.*` methods that map 1:1 onto a `logger` method — the only ones `no-znx-console` can
 * safely auto-fix. Any other `console.*` call (`console.table`, `console.trace`, ...) has no safe
 * equivalent and is reported without a `fix`.
 */
const CONSOLE_TO_LOGGER_METHOD: Record<string, string> = {
  log: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
}

const CONFIG_FILE_NAMES = ['deno.json', 'deno.jsonc']
const DEFAULT_LOGGER_IDENTIFIER = 'logger'

/**
 * Matches an `imports` map value that resolves to `@zanix/utils`'s `/logger` subpath — via the
 * real `jsr:@zanix/utils@.../logger` convention, or a local/relative override pointing at
 * `modules/logger/mod.ts` (the same shape as `auth`'s temp `@zanix/helpers` override).
 *
 * Never assume a single hardcoded alias: this ecosystem has at least two live conventions for the
 * same target (`@zanix/logger` in most repos, `@zanix/utils/logger` in `space-ui`) — the actual
 * alias string always comes from the target project's own config, resolved by the caller.
 */
function isLoggerSubpathTarget(target: string): boolean {
  return /\/logger(\/mod\.ts)?$/.test(target) &&
    (/zanix\/utils@/.test(target) || /modules\/logger/.test(target))
}

/**
 * Resolves the local import alias the target project's own `deno.json(c)` uses for
 * `@zanix/utils`'s `/logger` subpath, by walking up from the file being linted (bounded by the
 * filesystem root).
 *
 * Returns `null` when no resolvable alias exists — either no config file was found, or the
 * nearest one doesn't import `@zanix/utils`'s logger at all — meaning `@zanix/utils` isn't a real
 * dependency of the linted file's project, so no fix can safely be offered.
 */
function findLoggerAlias(filename: string): string | null {
  let dir: string
  try {
    dir = dirname(resolvePath(filename))
  } catch {
    return null
  }

  while (true) {
    for (const name of CONFIG_FILE_NAMES) {
      let raw: string
      try {
        raw = Deno.readTextFileSync(`${dir}/${name}`)
      } catch {
        continue
      }

      try {
        const config = JSON.parse(stripComments(raw)) as { imports?: Record<string, string> }
        for (const [alias, target] of Object.entries(config.imports ?? {})) {
          if (isLoggerSubpathTarget(target)) return alias
        }
      } catch {
        // Malformed config file — treat this project as having no resolvable alias.
      }
      // The nearest config file governs (mirrors real Deno config resolution): stop climbing
      // whether or not it declared the alias, never merge with a further ancestor's config.
      return null
    }

    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

/**
 * The local name already bound to a default import of `alias` in this file's own source, if any —
 * reused instead of inserting a second import for the same module.
 */
function findExistingImportLocal(program: Deno.lint.Program, alias: string): string | null {
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration' || statement.source.value !== alias) continue

    for (const specifier of statement.specifiers) {
      if (specifier.type === 'ImportDefaultSpecifier') return specifier.local.name
    }
  }
  return null
}

/**
 * The position to insert a new import at: before the first "real" statement, but after any
 * leading directive-prologue string-literal statements (e.g. the `'use comet'` flag `use-znx-flags`
 * validates) — inserting ahead of one of those would shift it off position 0 and break that rule.
 */
function getImportInsertionPoint(body: Deno.lint.Program['body']): number {
  let index = 0
  while (
    index < body.length &&
    body[index].type === 'ExpressionStatement' &&
    (body[index] as Deno.lint.ExpressionStatement).expression.type === 'Literal'
  ) {
    index++
  }
  return body[index]?.range[0] ?? 0
}

/**
 * `Deno lint` rule to validate the use of logger and console in `Zanix Framework`.
 *
 * If an invalid logger or console use is found, the following message will be shown:
 *
 *  `❌ Disallows the use of 'console'.`
 *
 * The purpose of this rule is to ensure that only the Zanix logger is used for logging,
 * maintaining consistency and better formatting.
 *
 * `console.log`/`console.info`/`console.warn`/`console.error` are auto-fixable to their `logger`
 * equivalent (`logger.debug`/`logger.info`/`logger.warn`/`logger.error`) via `deno lint --fix`.
 * Any other `console.*` method has no safe 1:1 mapping and is reported only.
 *
 * The fix resolves the real `logger` import alias from the linted file's own project
 * `deno.json(c)` (never a hardcoded one), reuses an existing `logger` import when the file
 * already has one, and is skipped entirely — leaving the file untouched — when the project
 * doesn't declare `@zanix/utils`'s `/logger` subpath as a dependency at all.
 */
const rules: Record<string, Deno.lint.Rule> = {
  'no-znx-console': {
    create(context) {
      // Resolved lazily, on the first fixable violation actually found in this file — and cached
      // (including the `null` "no dependency available" case) so a file with multiple
      // `console.*` calls only resolves the config, and inserts the import, at most once.
      let resolution:
        | { alias: string; identifier: string; importInserted: boolean }
        | null
        | undefined

      return {
        'CallExpression[callee.object.name="console"]'(node) {
          const callee = node.callee

          const method = !callee.computed && callee.property.type === 'Identifier'
            ? callee.property.name as string
            : null
          const loggerMethod = method ? CONSOLE_TO_LOGGER_METHOD[method] : undefined

          const reportData: Deno.lint.ReportData = {
            node,
            message: linterMessageFormat(`Disallows the use of 'console'.`),
            hint:
              `Please use the Zanix 'logger' module instead for consistent and properly formatted logging.`,
          }

          if (loggerMethod) {
            if (resolution === undefined) {
              const alias = findLoggerAlias(context.filename)
              resolution = alias
                ? {
                  alias,
                  identifier: findExistingImportLocal(context.sourceCode.ast, alias) ??
                    DEFAULT_LOGGER_IDENTIFIER,
                  importInserted: findExistingImportLocal(context.sourceCode.ast, alias) !== null,
                }
                : null
            }

            if (resolution) {
              const resolved = resolution
              reportData.fix = (fixer) => {
                const fixes = [
                  fixer.replaceTextRange(callee.range, `${resolved.identifier}.${loggerMethod}`),
                ]

                if (!resolved.importInserted) {
                  resolved.importInserted = true
                  const insertionPoint = getImportInsertionPoint(context.sourceCode.ast.body)
                  fixes.push(
                    fixer.insertTextBeforeRange(
                      [insertionPoint, insertionPoint],
                      `import ${resolved.identifier} from '${resolved.alias}'\n`,
                    ),
                  )
                }

                return fixes
              }
            }
          }

          context.report(reportData)
        },
      }
    },
  },
}

export default rules
