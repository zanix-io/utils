import { ValidationsMetadata } from 'modules/validations/base/metadata.ts'
import { assert, assertEquals, assertExists } from '@std/assert'

Deno.test('Validates metadata actions.', async () => {
  const metadata = new ValidationsMetadata()

  const dtoContainer = metadata as never

  // Initial default values
  assertEquals(Object.keys(metadata.getValidationSetup(dtoContainer)), [])
  assertEquals(metadata.getExposedProperties(dtoContainer), {})
  assertEquals(metadata.getOptionalProperties(dtoContainer), {})
  assertEquals(metadata.getNestedProperties(dtoContainer, 'error'), {})
  assertEquals(Object.keys(metadata.getPlainPayload(dtoContainer)), [])
  assertEquals(await metadata.getValidationErrors(dtoContainer), [])

  const setup = { expose: true, whiteListCallback: () => {} } as never
  metadata.setValidationSetup(dtoContainer, setup)
  const { target: _, ...data } = metadata.getValidationSetup(dtoContainer)
  assertEquals(data, setup)

  metadata.setExposedProperties(dtoContainer, { 'property 1': 'property value' })
  metadata.getExposedProperties(dtoContainer)['property 0'] = 'property value 0' as never
  assertEquals(metadata.getExposedProperties(dtoContainer), {
    'property 1': 'property value',
    'property 0': 'property value 0',
  })

  metadata.setOptionalProperties(dtoContainer, { 'property 1': true })
  metadata.getOptionalProperties(dtoContainer)['property 0'] = false
  assertEquals(metadata.getOptionalProperties(dtoContainer), {
    'property 1': true,
    'property 0': false,
  })

  metadata.setNestedProperties(dtoContainer, 'obj', {
    'propertyName': {
      each: true,
      optional: true,
    },
  })
  assertEquals(metadata.getNestedProperties(dtoContainer, 'obj'), {
    'propertyName': {
      each: true,
      optional: true,
    },
  })

  metadata.setPlainPayload(dtoContainer, { data: 'value' })
  assertEquals(metadata.getPlainPayload(dtoContainer), { data: 'value' })

  assert(Object.getOwnPropertyNames(metadata).length > 1)

  metadata.resetAll(dtoContainer) // reset all metadata
  metadata.resetNested(dtoContainer) // reset all metadata

  assertEquals(Object.getOwnPropertyNames(metadata), [])
})

Deno.test('Validates metadata errors.', async () => {
  const metadata = new ValidationsMetadata()

  const dtoContainer = metadata as never

  // Validation errors
  metadata.setValidationError({
    target: dtoContainer,
    property: 'error property',
    value: 'error value',
    constraints: ['error constraint'],
  })

  metadata.setValidationError({
    target: dtoContainer,
    property: 'error property 2',
    value: 'error value 2',
    constraints: ['error constraint 1', 'error constraint 2'],
  })

  metadata.setValidationError({
    target: dtoContainer,
    property: 'error property',
    value: 'error value',
    constraints: ['error constraint 2 error property 1'],
  })

  metadata.setValidationError({
    target: dtoContainer,
    property: 'error property 2',
    value: 'error value',
    constraints: ['error constraint 2 error property 2'],
  })

  metadata.setValidationError({
    target: dtoContainer,
    property: 'error property 3',
    value: 'error value 3',
    constraints: ['error constraint 3'],
  })

  // Promise resolver. When true there is an error.

  metadata.setValidationError({
    target: dtoContainer,
    property: 'error property 3',
    value: 'error value 3 async validation fail',
    constraints: ['error constraint 3 async validation fail'],
  }, Promise.resolve(true))

  metadata.setValidationError({
    target: dtoContainer,
    property: 'error property 3',
    value: 'error value 3 async validation fail',
    constraints: ['error constraint 3 async validation fail', 'constraint accepted'], // first constraint should be avoid, is the same constraint
  }, Promise.resolve(true))

  metadata.setValidationError({
    target: dtoContainer,
    property: 'error property 3',
    value: 'error value 3 not proceed',
    constraints: ['error constraint 3 not proceed', 'error constraint 3 neigther proceed'],
  }, Promise.resolve(false))

  metadata.setValidationError({
    target: dtoContainer,
    property: 'error property 4',
    value: 'error value 4 async',
    constraints: ['error constraint 4 async'],
  }, Promise.resolve(true))

  metadata.setValidationError({
    target: dtoContainer,
    property: 'error property 4',
    value: 'error value 4',
    constraints: ['error constraint 4 new constraint'],
  })

  metadata.setValidationError({
    target: dtoContainer,
    property: 'error property 5',
    value: 'error value 5 not proceed',
    constraints: ['error constraint 5 not proceed'],
  }, Promise.resolve(false))

  const errors = await metadata.getValidationErrors(dtoContainer)

  assertExists(errors[0].target['errorKeys' as never])

  assert(Object.getOwnPropertyNames(metadata).length > 1)

  metadata.resetAll(dtoContainer) // testing reset all metadata

  assertEquals(Object.getOwnPropertyNames(metadata), [])

  assertEquals(errors.length, 4)

  // Check constrains concatenation

  assertEquals(errors[0].constraints, [
    'error constraint',
    'error constraint 2 error property 1',
  ])

  assertEquals(errors[1].constraints, [
    'error constraint 1',
    'error constraint 2',
    'error constraint 2 error property 2',
  ])

  assertEquals(errors[2].constraints, [
    'error constraint 3',
    'error constraint 3 async validation fail',
    'constraint accepted',
  ])

  assertEquals(errors[3].constraints, [
    'error constraint 4 async',
    'error constraint 4 new constraint',
  ])
})
