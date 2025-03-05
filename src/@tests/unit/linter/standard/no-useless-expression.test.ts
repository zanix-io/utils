import { assertEquals } from 'https://deno.land/std@0.151.0/testing/asserts.ts'
import standardPlugin from 'linter/plugins/standard/mod.ts'

const fileName = 'test.ts'

Deno.test('no-useless-expression plugin should report expression violations', () => {
  // Run the plugin on a test file with code that should violate the no-require rule
  const diagnostics = Deno.lint.runPlugin(
    standardPlugin,
    fileName,
    `\n'literal expression';`,
  )

  // Ensure there is exactly one diagnostic violation
  assertEquals(diagnostics.length, 1)

  // Log diagnostics for debugging
  const mainDiagnostic = diagnostics[0]

  // Verify the diagnostic contains the correct details
  assertEquals({ ...mainDiagnostic }, {
    id: 'deno-std-plugin/no-useless-expression',
    message: '❌ Unnecessary expression.',
    range: [1, 22],
    hint: 'Remove it as it has no effect on the code.',
    fix: [],
  })
})
