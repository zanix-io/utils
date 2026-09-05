import { assertEquals } from '@std/assert'
import zanixPlugin from 'modules/linter/plugins/zanix/mod.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'

const fileName = 'test.ts'
const RULE_ID = 'deno-zanix-plugin/no-unexported-comet-component'

/** Every real diagnostic this rule reports carries `id === RULE_ID` — other combined rules can
 * also fire on the same sample code, so tests always filter by id rather than asserting on
 * `diagnostics` as a whole (same discipline `no-invalid-znx-cookie-name`'s own tests follow). */
function ownDiagnostics(code: string) {
  return Deno.lint.runPlugin(zanixPlugin, fileName, code).filter((d) => d.id === RULE_ID)
}

const IMPORT = `import { defineComet } from '@zanix/space/comet'\n`

function message(name: string): string {
  return linterMessageFormat(
    `Comet component "${name}" is declared but not exported — defineComet reads Component.name ` +
      `at runtime, and the client looks it up as a named export of this same module after a ` +
      `dynamic import.`,
  )
}

function hint(name: string): string {
  return `Add "export" to its declaration (e.g. "export function ${name}(...) {}") — an ` +
    `unexported named component compiles and lints cleanly today, then crashes client-side at ` +
    `hydration with "Element type is invalid: expected a string... but got: undefined".`
}

Deno.test(
  'no-unexported-comet-component flags a named function component missing its own export',
  () => {
    const code = `${IMPORT}
      function Counter() { return null }
      export default defineComet(Counter, import.meta.url)
    `
    const diagnostics = ownDiagnostics(code)

    assertEquals(diagnostics.length, 1)
    assertEquals(diagnostics[0].message, message('Counter'))
    assertEquals(diagnostics[0].hint, hint('Counter'))
  },
)

Deno.test(
  'no-unexported-comet-component flags a named const component (arrow function) missing its own export',
  () => {
    const code = `${IMPORT}
      const Counter = () => null
      export default defineComet(Counter, import.meta.url)
    `
    const diagnostics = ownDiagnostics(code)

    assertEquals(diagnostics.length, 1)
    assertEquals(diagnostics[0].message, message('Counter'))
  },
)

Deno.test(
  'no-unexported-comet-component auto-fix inserts "export " immediately before the declaration',
  () => {
    const code = `${IMPORT}
function Counter() { return null }
export default defineComet(Counter, import.meta.url)
`
    const diagnostics = ownDiagnostics(code)

    assertEquals(diagnostics.length, 1)
    const declarationIndex = code.indexOf('function Counter')
    assertEquals(diagnostics[0].fix, [
      { range: [declarationIndex, declarationIndex], text: 'export ' },
    ])
  },
)

Deno.test(
  'no-unexported-comet-component auto-fix inserts "export " before a const declaration too',
  () => {
    const code = `${IMPORT}
const Counter = () => null
export default defineComet(Counter, import.meta.url)
`
    const diagnostics = ownDiagnostics(code)

    assertEquals(diagnostics.length, 1)
    const declarationIndex = code.indexOf('const Counter')
    assertEquals(diagnostics[0].fix, [
      { range: [declarationIndex, declarationIndex], text: 'export ' },
    ])
  },
)

Deno.test(
  'no-unexported-comet-component fixes every violation independently in a file with two unexported comets, each keeping its own insertion point (no duplicate/misplaced fix)',
  () => {
    const code = `${IMPORT}
function Counter() { return null }
function Gauge() { return null }
export default defineComet(Counter, import.meta.url)
export const gaugeComet = defineComet(Gauge, import.meta.url)
`
    const diagnostics = ownDiagnostics(code)

    assertEquals(diagnostics.length, 2)
    assertEquals(diagnostics[0].message, message('Counter'))
    assertEquals(diagnostics[1].message, message('Gauge'))

    const counterIndex = code.indexOf('function Counter')
    const gaugeIndex = code.indexOf('function Gauge')
    assertEquals(diagnostics[0].fix, [{ range: [counterIndex, counterIndex], text: 'export ' }])
    assertEquals(diagnostics[1].fix, [{ range: [gaugeIndex, gaugeIndex], text: 'export ' }])
  },
)

Deno.test(
  'no-unexported-comet-component does not flag an already-exported function component',
  () => {
    const code = `${IMPORT}
      export function Counter() { return null }
      export default defineComet(Counter, import.meta.url)
    `
    assertEquals(ownDiagnostics(code), [])
  },
)

Deno.test(
  'no-unexported-comet-component does not flag an already-exported const component',
  () => {
    const code = `${IMPORT}
      export const Counter = () => null
      export default defineComet(Counter, import.meta.url)
    `
    assertEquals(ownDiagnostics(code), [])
  },
)

Deno.test(
  'no-unexported-comet-component does not flag a component re-exported via a separate export {} statement',
  () => {
    const code = `${IMPORT}
      function Counter() { return null }
      export { Counter }
      export default defineComet(Counter, import.meta.url)
    `
    assertEquals(ownDiagnostics(code), [])
  },
)

Deno.test(
  'no-unexported-comet-component ignores a non-Identifier first argument (inline function expression)',
  () => {
    const code =
      `${IMPORT}export default defineComet(function Counter() { return null }, import.meta.url)\n`
    assertEquals(ownDiagnostics(code), [])
  },
)

Deno.test(
  'no-unexported-comet-component ignores an identifier it cannot resolve to a same-file top-level declaration (e.g. imported from elsewhere)',
  () => {
    const code = `${IMPORT}
      import { Counter } from './counter-impl.ts'
      export default defineComet(Counter, import.meta.url)
    `
    assertEquals(ownDiagnostics(code), [])
  },
)

Deno.test(
  'no-unexported-comet-component does not flag a file that never imports defineComet from @zanix/space/comet',
  () => {
    const code = `
      function defineComet(Component: unknown, url: string) { return Component }
      function Counter() { return null }
      export default defineComet(Counter, import.meta.url)
    `
    // Same-named local function, never actually imported from '@zanix/space/comet' — the same
    // "never assume, always resolve the real import" discipline no-invalid-znx-cookie-name follows.
    assertEquals(ownDiagnostics(code), [])
  },
)

Deno.test(
  'no-unexported-comet-component resolves an aliased named import to the real defineComet',
  () => {
    const code = `import { defineComet as define } from '@zanix/space/comet'
      function Counter() { return null }
      export default define(Counter, import.meta.url)
    `
    const diagnostics = ownDiagnostics(code)

    assertEquals(diagnostics.length, 1)
    assertEquals(diagnostics[0].message, message('Counter'))
  },
)

Deno.test(
  'no-unexported-comet-component does not flag calls to an unrelated function that merely shares defineComet-like arguments',
  () => {
    const code = `
      function Counter() { return null }
      someOtherFunction(Counter, import.meta.url)
    `
    assertEquals(ownDiagnostics(code), [])
  },
)
