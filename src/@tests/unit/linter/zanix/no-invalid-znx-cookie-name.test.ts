import { assertEquals } from '@std/assert'
import zanixPlugin from 'modules/linter/plugins/zanix/mod.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'

const fileName = 'test.ts'
const RULE_ID = 'deno-zanix-plugin/no-invalid-znx-cookie-name'

/** Every real diagnostic this rule reports carries `id === RULE_ID` — other combined rules
 * (`single-quote`, etc.) can also fire on the same sample code, so tests always filter by id
 * rather than asserting on `diagnostics` as a whole. */
function ownDiagnostics(code: string) {
  return Deno.lint.runPlugin(zanixPlugin, fileName, code).filter((d) => d.id === RULE_ID)
}

/** The exact range of `literal` (including its surrounding quotes) inside `code`, computed instead
 * of hand-counted, so it can never silently drift from the sample string above it. */
function literalRange(code: string, literal: string): [number, number] {
  const quoted = `'${literal}'`
  const start = code.indexOf(quoted)
  return [start, start + quoted.length]
}

const IMPORT_ALL =
  `import { csrfGuard, langGuard, langPreHandler, populationGuard } from '@zanix/space'\n`

Deno.test(
  'no-invalid-znx-cookie-name flags a literal missing the "X-Znx-" prefix, for all four guards',
  () => {
    const cases: [name: string, call: string][] = [
      ['csrfGuard', `csrfGuard({ cookieName: 'session-csrf' })`],
      ['langGuard', `langGuard({ cookieName: 'lang' })`],
      ['langPreHandler', `langPreHandler({ cookieName: 'lang' })`],
      ['populationGuard', `populationGuard({ cookieName: 'population' })`],
    ]

    for (const [name, call] of cases) {
      const code = `${IMPORT_ALL}${call}\n`
      const literal = call.match(/cookieName: '([^']+)'/)?.[1] as string
      const diagnostics = ownDiagnostics(code)

      assertEquals(diagnostics.length, 1, `expected exactly one diagnostic for ${name}`)
      assertEquals({ ...diagnostics[0] }, {
        id: RULE_ID,
        message: linterMessageFormat(
          `Cookie name "${literal}" for '${name}' must start with "X-Znx-".`,
        ),
        hint:
          `@zanix/server's cookiesGuard silently drops any cookie outside the "X-Znx-" prefix from ctx.cookies before any guard/handler runs — rename it to e.g. "X-Znx-${literal}".`,
        range: literalRange(code, literal),
        fix: [],
      })
    }
  },
)

Deno.test(
  'no-invalid-znx-cookie-name flags a "X-Znx-" prefixed literal missing "Csrf" for csrfGuard only',
  () => {
    const code = `${IMPORT_ALL}csrfGuard({ cookieName: 'X-Znx-Token' })\n`
    const diagnostics = ownDiagnostics(code)

    assertEquals(diagnostics.length, 1)
    assertEquals({ ...diagnostics[0] }, {
      id: RULE_ID,
      message: linterMessageFormat(
        `Cookie name "X-Znx-Token" for 'csrfGuard' must contain "Csrf" (case-insensitive).`,
      ),
      hint:
        `@zanix/utils's sensitive-key redaction pattern recognizes a CSRF cookie by the "Csrf" keyword in its name — a customized name dropping it would silently stop being redacted from logs.`,
      range: literalRange(code, 'X-Znx-Token'),
      fix: [],
    })
  },
)

Deno.test(
  'no-invalid-znx-cookie-name does not require the "Csrf" keyword for langGuard/langPreHandler/populationGuard',
  () => {
    const code = `${IMPORT_ALL}
      langGuard({ cookieName: 'X-Znx-Lang' })
      langPreHandler({ cookieName: 'X-Znx-Lang' })
      populationGuard({ cookieName: 'X-Znx-Population' })
    `
    assertEquals(ownDiagnostics(code), [])
  },
)

Deno.test(
  'no-invalid-znx-cookie-name accepts a valid literal cookieName for all four guards',
  () => {
    const code = `${IMPORT_ALL}
      csrfGuard({ cookieName: 'X-Znx-Csrf' })
      langGuard({ cookieName: 'X-Znx-Lang' })
      langPreHandler({ cookieName: 'X-Znx-Lang' })
      populationGuard({ cookieName: 'X-Znx-Population' })
    `
    assertEquals(ownDiagnostics(code), [])
  },
)

Deno.test(
  "no-invalid-znx-cookie-name never flags a dynamically-computed cookieName — that is the runtime assertZnxCookieName check's job",
  () => {
    const code = `${IMPORT_ALL}
      const name = 'session'
      csrfGuard({ cookieName: name })
      langGuard({ cookieName: \`X-\${'Znx'}-Lang\` })
      populationGuard({ cookieName: getCookieName() })
    `
    assertEquals(ownDiagnostics(code), [])
  },
)

Deno.test(
  'no-invalid-znx-cookie-name does not flag a same-named local function that is not actually imported from @zanix/space',
  () => {
    // No import from '@zanix/space' at all here — `csrfGuard` is just a local function that
    // happens to share the name. Confirms the rule resolves the real import instead of matching
    // by bare name (same "never assume, always resolve the real import" discipline as
    // `no-znx-console`'s own logger-alias resolution).
    const code = `
      function csrfGuard(options: { cookieName?: string }) { return options }
      csrfGuard({ cookieName: 'session' })
    `
    assertEquals(ownDiagnostics(code), [])
  },
)

Deno.test(
  'no-invalid-znx-cookie-name resolves an aliased named import to its real @zanix/space name',
  () => {
    const code =
      `import { csrfGuard as guard } from '@zanix/space'\nguard({ cookieName: 'session' })\n`
    const diagnostics = ownDiagnostics(code)

    assertEquals(diagnostics.length, 1)
    assertEquals(
      diagnostics[0].message,
      linterMessageFormat(`Cookie name "session" for 'csrfGuard' must start with "X-Znx-".`),
    )
  },
)

Deno.test(
  'no-invalid-znx-cookie-name ignores calls with no options argument or without a cookieName property',
  () => {
    const code = `${IMPORT_ALL}
      csrfGuard()
      langGuard({ headerName: 'x-lang' })
    `
    assertEquals(ownDiagnostics(code), [])
  },
)
