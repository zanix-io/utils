import { classValidation } from 'modules/validations/mod.ts'
import { assertEquals, assertRejects } from '@std/assert'
import { HttpError } from 'modules/errors/main.ts'
import { ValidatorRTO } from './rtos/generics.ts'

Deno.test('ValidatorRTO validation', async () => {
  // errors
  await assertRejects(
    () =>
      classValidation(ValidatorRTO, { stringPropWithDefaults: 'ds' }).catch((err) => {
        assertEquals(err.cause.message, 'Request validation error')
        assertEquals(Object.keys(err.cause.properties).length, 2)
        assertEquals(err.cause.properties.stringPropWithDefaults, [{
          constraints: ["'stringPropWithDefaults' must be a valid numeric string."],
          value: 'ds',
          plainValue: 'ds',
        }])
        assertEquals(err.cause.properties.compoundRequiredVal, [{
          constraints: [
            "validation message for compoundRequiredVal:'default value'. 'stringPropWithDefaults' must be '5' and 'value' must be '4'. data: {stringPropWithDefaults: ds, valueOptional:'3' and value:undefined}",
          ],
          value: 'default value',
          plainValue: undefined,
        }])
        assertEquals(err.cause.target, 'ValidatorRTO')
        throw err
      }),
    HttpError,
    'BAD_REQUEST',
  )

  await assertRejects(
    () =>
      classValidation(ValidatorRTO, { value: '3', valueOptional: '4' }).catch((err) => {
        assertEquals(err.cause.message, 'Request validation error')
        assertEquals(Object.keys(err.cause.properties).length, 1)
        assertEquals(err.cause.properties.compoundRequiredVal, [{
          constraints: [
            "validation message for compoundRequiredVal:'default value'. 'stringPropWithDefaults' must be '5' and 'value' must be '4'. data: {stringPropWithDefaults: 5, valueOptional:'4' and value:3}",
          ],
          value: 'default value',
          plainValue: undefined,
        }])
        assertEquals(err.cause.target, 'ValidatorRTO')
        throw err
      }),
    HttpError,
    'BAD_REQUEST',
  )

  // composed validation OK
  const valid = await classValidation(ValidatorRTO, {
    value: '4',
    compoundRequiredVal: 'my own',
    valueOptional: 9,
  })
  assertEquals(valid.compoundRequiredVal, 'my own')
  assertEquals(valid.value, '4')
  assertEquals(valid.stringPropWithDefaults, '5')
  assertEquals(valid.valueOptional, 9)
})

Deno.test('Class validation', async () => {
  // showld not throws
  const values = await classValidation(ValidatorRTO, {}, { throwErrors: () => {} })

  assertEquals(values.stringPropWithDefaults, '5')

  // showld not expose defaults
  const values2 = await classValidation(ValidatorRTO, { extraneus: 'extraneus' }, {
    throwErrors: () => {},
    exposeDefaultsValues: false,
  })

  assertEquals(values2.stringPropWithDefaults, undefined)
  assertEquals(values2['extraneus' as never], undefined)

  // showld retreive extraneus
  const values3 = await classValidation(ValidatorRTO, { extraneus: 'extraneus value' }, {
    throwErrors: () => {},
    excludeExtraneousValues: false,
  })

  assertEquals(values3.stringPropWithDefaults, '5')
  assertEquals(values3['extraneus' as never], 'extraneus value')
})
