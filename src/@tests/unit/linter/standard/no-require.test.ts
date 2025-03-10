import { assertEquals } from '@std/assert'
import standardPlugin from 'modules/linter/plugins/standard/mod.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'

const fileName = 'test.ts'

Deno.test('no-require plugin should report load modules violations', () => {
  // Run the plugin on a test file with code that should violate the no-require rule
  const diagnostics = Deno.lint.runPlugin(
    standardPlugin,
    fileName,
    `const fs = require("fs");`,
  )

  // Ensure there is exactly one diagnostic violation
  assertEquals(diagnostics.length, 1)

  // Verify the diagnostic contains the correct details

  const mainDiagnostic = diagnostics[0]

  assertEquals({ ...mainDiagnostic }, {
    id: 'deno-std-plugin/no-require',
    message: linterMessageFormat("Don't use require() calls to load modules."),
    range: [11, 24],
    hint: 'Use `import` instead.',
    fix: [],
  })
})
