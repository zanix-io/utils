import { assertEquals } from '@std/assert'
import zanixPlugin from 'modules/linter/plugins/zanix/mod.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'

const fileName = 'test.ts'

Deno.test('no-znx-console plugin should report Zanix logger violations', () => {
  // Run the plugin on a test file with code that should violate the no-znx-console rule
  const diagnostics = Deno.lint.runPlugin(
    zanixPlugin,
    fileName,
    `console.log(0);
    console.error(0);
    console.info(0);
    console.debug(0);
    console.warn(0);`,
  )

  // Ensure there is exactly one diagnostic violation
  assertEquals(diagnostics.length, 5)

  // Verify the diagnostic contains the correct details
  const ranges = [
    [0, 14],
    [20, 36],
    [42, 57],
    [63, 79],
    [85, 100],
  ]

  diagnostics.forEach((diagnostic, index) => {
    assertEquals({ ...diagnostic }, {
      id: 'deno-zanix-plugin/no-znx-console',
      message: linterMessageFormat("Disallows the use of 'console'."),
      hint:
        "Please use the Zanix global 'logger' module instead for consistent and properly formatted logging.",
      range: ranges[index],
      fix: [],
    })
  })
})
