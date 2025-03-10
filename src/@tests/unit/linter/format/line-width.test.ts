import { assertEquals } from '@std/assert'
import formatPlugin from 'modules/linter/plugins/format/mod.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'

const fileName = 'test.ts'

Deno.test('line-width plugin should report line width violations', () => {
  // Run the plugin on a test file with code that should violate the line-width rule
  const diagnostics = Deno.lint.runPlugin(
    formatPlugin,
    fileName,
    `const a = 'This is a really really really long line that exceeds the maximum allowed width to testing';`,
  )

  // Ensure there is exactly one diagnostic violation
  assertEquals(diagnostics.length, 1)

  // Verify the diagnostic contains the correct details

  const mainDiagnostic = diagnostics[0]

  assertEquals({ ...mainDiagnostic }, {
    id: 'deno-fmt-plugin/line-width',
    message: linterMessageFormat('The line exceeds the maximum allowed width of 100 characters.'),
    range: [0, 103],
    hint: 'Consider reviewing the formatting plugin.',
    fix: [],
  })
})
