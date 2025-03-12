import { assertEquals } from '@std/assert'
import zanixPlugin from 'modules/linter/plugins/zanix/mod.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'

const fileName = 'test.ts'

Deno.test('no-explicit-znx-import plugin should report explicit imports violations', () => {
  const diagnostics = Deno.lint.runPlugin(
    zanixPlugin,
    fileName,
    `import 'https://jsr.io/@zanix/utils/1.0.0/src/modules/helpers/zanix/folders/mod.ts'
    import 'utils`,
  )

  // Ensure there is exactly one diagnostic violation
  assertEquals(diagnostics.length, 1)

  assertEquals({ ...diagnostics[0] }, {
    id: 'deno-zanix-plugin/no-explicit-znx-imports',
    message: linterMessageFormat(
      "Explicit imports from '@zanix' modules with file extensions are not allowed. Use the package imports instead.",
    ),
    hint:
      "Please avoid importing files from '@zanix' with extensions. Use the package name without the file extension (e.g., '@zanix/module').",
    range: [0, 83],
    fix: [],
  })
})
