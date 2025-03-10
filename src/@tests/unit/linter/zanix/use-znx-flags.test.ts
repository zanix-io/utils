import { assertEquals } from '@std/assert'
import zanixPlugin from 'modules/linter/plugins/zanix/mod.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'
import constants from 'modules/helpers/zanix/flags.ts'

const fileName = 'test.ts'

Deno.test('use-znx-flags plugin should report Zanix flags violations', () => {
  // Run the plugin on a test file with code that should violate the use-znx-flags rule
  const diagnostics = Deno.lint.runPlugin(
    zanixPlugin,
    fileName,
    `'otherFlag'`,
  )

  // Ensure there is exactly one diagnostic violation
  assertEquals(diagnostics.length, 1)

  // Verify the diagnostic contains the correct details
  const mainDiagnostic = diagnostics[0]

  assertEquals({ ...mainDiagnostic }, {
    id: 'deno-zanix-plugin/use-znx-flags',
    message: linterMessageFormat('The flag "otherFlag" is invalid.'),
    range: [0, 11],
    hint: `Review available flags:\n ${constants.ZNX_FLAGS.join(', ')}`,
    fix: [],
  })
})
