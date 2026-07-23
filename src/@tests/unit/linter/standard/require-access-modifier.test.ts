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
      property
      #private(){
      }
      constructor(){
      }
      method(){
        return 1;
      }
    }`,
  )

  // Ensure there is exactly one diagnostic violation per public member without a modifier
  assertEquals(diagnostics.length, 2)

  // Verify the diagnostic contains the correct details

  const [propertyDiagnostic, methodDiagnostic] = diagnostics

  assertEquals({ ...propertyDiagnostic }, {
    id: 'deno-std-plugin/require-access-modifier',
    message: linterMessageFormat(
      'Properties should have an explicit access modifier (public, private, protected).',
    ),
    range: [57, 65],
    hint: 'Add a public, private, or protected modifier to the property.',
    fix: [],
  })

  assertEquals({ ...methodDiagnostic }, {
    id: 'deno-std-plugin/require-access-modifier',
    message: linterMessageFormat(
      'Methods should have an explicit access modifier (public, private, protected).',
    ),
    range: [127, 162],
    hint: 'Add a public, private, or protected modifier to the method.',
    fix: [],
  })
})
