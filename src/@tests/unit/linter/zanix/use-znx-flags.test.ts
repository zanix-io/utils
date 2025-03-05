import { assertEquals } from 'https://deno.land/std@0.151.0/testing/asserts.ts'
import zanixPlugin from 'linter/plugins/zanix/mod.ts'
import { ZNX_FLAGS } from 'utils/zanix/flags.ts'

const fileName = 'test.ts'

Deno.test('use-zanix-flags plugin should report Zanix flags violations', () => {
  // Run the plugin on a test file with code that should violate the use-zanix-flags rule
  const diagnostics = Deno.lint.runPlugin(
    zanixPlugin,
    fileName,
    `'otherFlag'`,
  )

  // Ensure there is exactly one diagnostic violation
  assertEquals(diagnostics.length, 1)

  // Log diagnostics for debugging
  const mainDiagnostic = diagnostics[0]

  // Verify the diagnostic contains the correct details
  assertEquals({ ...mainDiagnostic }, {
    id: 'deno-zanix-plugin/use-znx-flags',
    message: '❌ The flag "otherFlag" is invalid.',
    range: [0, 11],
    hint: `Review available flags:\n ${ZNX_FLAGS.join(', ')}`,
    fix: [],
  })
})
