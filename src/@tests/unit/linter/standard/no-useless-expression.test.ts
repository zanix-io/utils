import { assertEquals } from '@std/assert'
import standardPlugin from 'modules/linter/plugins/standard/mod.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'

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

  // Verify the diagnostic contains the correct details

  const mainDiagnostic = diagnostics[0]

  assertEquals({ ...mainDiagnostic }, {
    id: 'deno-std-plugin/no-useless-expression',
    message: linterMessageFormat('Unnecessary expression.'),
    range: [1, 22],
    hint: 'Remove it as it has no effect on the code.',
    fix: [],
  })
})
