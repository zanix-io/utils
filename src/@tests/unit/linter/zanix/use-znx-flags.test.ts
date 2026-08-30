import { assertEquals } from '@std/assert'
import zanixPlugin from 'modules/linter/plugins/zanix/mod.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'
import { ZNX_FLAGS } from 'utils/constants.ts'

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
    hint: `Review available flags:\n ${ZNX_FLAGS.join(', ')}`,
    fix: [],
  })
})

Deno.test('use-znx-flags plugin should accept a known flag as the first statement', () => {
  const diagnostics = Deno.lint.runPlugin(
    zanixPlugin,
    fileName,
    `'use comet'\nexport function Counter() { return null }`,
  )

  assertEquals(
    diagnostics.filter((d) => d.id === 'deno-zanix-plugin/use-znx-flags'),
    [],
  )
})

Deno.test(
  "use-znx-flags plugin should accept 'server-only' as a known flag too",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      zanixPlugin,
      fileName,
      `'server-only'\nexport function loadState() {}`,
    )

    assertEquals(
      diagnostics.filter((d) => d.id === 'deno-zanix-plugin/use-znx-flags'),
      [],
    )
  },
)

Deno.test(
  'use-znx-flags plugin should only validate a flag-shaped literal at the very first statement',
  () => {
    // A string literal that isn't the file's first statement is just a plain expression, not a
    // directive-prologue flag — the rule must not touch it.
    const diagnostics = Deno.lint.runPlugin(
      zanixPlugin,
      fileName,
      `const x = 1\n'otherFlag'`,
    )

    assertEquals(
      diagnostics.filter((d) => d.id === 'deno-zanix-plugin/use-znx-flags'),
      [],
    )
  },
)
