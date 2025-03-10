import { assertEquals } from '@std/assert'
import requireAccessModifier from 'modules/linter/plugins/standard/mod.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'

const fileName = 'test.ts'

Deno.test('require-access-modifier plugin should report encapsulation violations', () => {
  // Run the plugin on a test file with code that should violate encapsulation rules
  const diagnostics = Deno.lint.runPlugin(
    requireAccessModifier,
    fileName,
    `function b(){
    }

    class A {
      #property
      #private(){
      }
      constructor(){
      }
      method(){
        return 1;
      }
    }`,
  )

  // Ensure there is exactly one diagnostic violation
  assertEquals(diagnostics.length, 1)

  // Verify the diagnostic contains the correct details

  const mainDiagnostic = diagnostics[0]

  assertEquals({ ...mainDiagnostic }, {
    id: 'deno-std-plugin/require-access-modifier',
    message: linterMessageFormat(
      'Methods should have an explicit access modifier (public, private, protected).',
    ),
    range: [112, 147],
    hint: 'Add a public, private, or protected modifier to the method.',
    fix: [],
  })
})
