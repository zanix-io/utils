import { assertEquals } from 'https://deno.land/std@0.151.0/testing/asserts.ts'
import formatPlugin from 'linter/plugins/format/mod.ts'

const fileName = 'test.ts'

Deno.test('single-quote plugin should report quotes width violations', () => {
  // Run the plugin on a test file with code that should violate the single-quote rule
  const diagnostics = Deno.lint.runPlugin(
    formatPlugin,
    fileName,
    `const a = "This is double quoted";`,
  )

  // Ensure there is exactly one diagnostic violation
  assertEquals(diagnostics.length, 1)

  // Log diagnostics for debugging
  const mainDiagnostic = diagnostics[0]

  // Verify the diagnostic contains the correct details
  assertEquals({ ...mainDiagnostic }, {
    id: 'deno-fmt-plugin/single-quote',
    message: '❌ Use single quotes instead of double quotes.',
    range: [10, 33],
    hint: 'Consider reviewing the formatting plugin.',
    fix: [],
  })
})
