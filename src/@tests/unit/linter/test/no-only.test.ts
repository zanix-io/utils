import { assertEquals } from 'https://deno.land/std@0.151.0/testing/asserts.ts'
import testPlugin from 'linter/plugins/test/mod.ts'

const fileName = 'test.ts'

Deno.test('no-only plugin should report test violations', () => {
  // Run the plugin on a test file with code that should violate the no-only rule
  const diagnostics = Deno.lint.runPlugin(
    testPlugin,
    fileName,
    `Deno.test.only('test', () => {})`,
  )

  // Ensure there is exactly one diagnostic violation
  assertEquals(diagnostics.length, 1)

  // Log diagnostics for debugging
  const mainDiagnostic = diagnostics[0]

  // Verify the diagnostic contains the correct details
  assertEquals({ ...mainDiagnostic }, {
    id: 'deno-test-plugin/no-only',
    message: '❌ Deno.test.only is not allowed.',
    range: [0, 32],
    hint: 'Please remove it before pushing to the repository.',
    fix: [],
  })
})
