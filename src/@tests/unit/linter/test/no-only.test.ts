import { assertEquals } from '@std/assert'
import testPlugin from 'modules/linter/plugins/test/mod.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'

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

  // Verify the diagnostic contains the correct details

  const mainDiagnostic = diagnostics[0]

  assertEquals({ ...mainDiagnostic }, {
    id: 'deno-test-plugin/no-only',
    message: linterMessageFormat('Deno.test.only is not allowed.'),
    range: [0, 32],
    hint: 'Please remove no only condition.',
    fix: [],
  })
})
