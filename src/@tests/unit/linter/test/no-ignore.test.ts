import { assertEquals } from '@std/assert'
import testPlugin from 'modules/linter/plugins/test/mod.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'

const fileName = 'test.ts'

Deno.test('no-ignore plugin should report test violations', () => {
  // Run the plugin on a test file with code that should violate the no-ignore rule
  const diagnostics = Deno.lint.runPlugin(
    testPlugin,
    fileName,
    `Deno.test.ignore('test', () => {})`,
  )

  // Ensure there is exactly one diagnostic violation
  assertEquals(diagnostics.length, 1)

  // Verify the diagnostic contains the correct details

  const mainDiagnostic = diagnostics[0]

  assertEquals({ ...mainDiagnostic }, {
    id: 'deno-test-plugin/no-ignore',
    message: linterMessageFormat('Deno.test.ignore is not allowed.'),
    range: [0, 34],
    hint: 'Please make sure not to ignore it',
    fix: [],
  })
})
