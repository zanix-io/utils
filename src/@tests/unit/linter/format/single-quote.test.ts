import { assertEquals } from '@std/assert'
import formatPlugin from 'modules/linter/plugins/format/mod.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'

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

  // Verify the diagnostic contains the correct details

  const mainDiagnostic = diagnostics[0]

  assertEquals({ ...mainDiagnostic }, {
    id: 'deno-fmt-plugin/single-quote',
    message: linterMessageFormat('Use single quotes instead of double quotes.'),
    range: [10, 33],
    hint: 'Consider reviewing the formatting plugin.',
    fix: [],
  })
})
