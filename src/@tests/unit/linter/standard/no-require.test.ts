import { assertEquals } from 'https://deno.land/std@0.151.0/testing/asserts.ts'
import standardPlugin from 'linter/plugins/standard/mod.ts'

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

  // Log diagnostics for debugging
  const mainDiagnostic = diagnostics[0]

  // Verify the diagnostic contains the correct details
  assertEquals({ ...mainDiagnostic }, {
    id: 'deno-std-plugin/no-require',
    message: "❌ Don't use require() calls to load modules.",
    range: [11, 24],
    hint: 'Use `import` instead.',
    fix: [],
  })
})
