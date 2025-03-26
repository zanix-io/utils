import { classValidation } from 'modules/validations/mod.ts'
import { assertEquals, assertRejects } from '@std/assert'
import { HttpError } from 'modules/errors/main.ts'
import { ExposeRTO } from './rtos/generics.ts'

Deno.test('ExposeRTO validation errors', async () => {
  // errors
  await assertRejects(
    () =>
      classValidation(ExposeRTO, {}).catch((err) => {
        assertEquals(err.cause.message, 'Request validation error')
        assertEquals(Object.keys(err.cause.properties).length, 2)
        assertEquals(err.cause.properties.value, [{
          constraints: [
            "The 'value' property must be defined when exposed. To make it optional, set the corresponding option to true.",
            "'value' must be a valid string.",
          ],
          value: undefined,
          plainValue: undefined,
        }])
        assertEquals(err.cause.properties.test, [{
          constraints: [
            "The 'test' property must be defined when exposed. To make it optional, set the corresponding option to true.",
          ],
          value: undefined,
          plainValue: undefined,
        }])
        assertEquals(err.cause.target, 'ExposeRTO')
        throw err
      }),
    HttpError,
    'BAD_REQUEST',
  )
})

Deno.test('ExposeRTO validations', async () => {
  const values = await classValidation(ExposeRTO, { value: 'string value', test: 'test value' })
  assertEquals(values.age, 3)
  assertEquals(values.optionalValue, undefined)
  assertEquals(values.value, 'string value')
  assertEquals(values.test, 'test value')

  const values2 = await classValidation(ExposeRTO, {
    value: 'string value',
    test: 'test value',
    age: 6,
    optionalValue: 3,
    optionalValue2: 4,
    optionalValue3: 5,
    numberString: '5',
  })
  assertEquals(values2.age, 6)
  assertEquals(values2.optionalValue, 3)
  assertEquals(values2.optionalValue2, 'value:4')
  assertEquals(values2.optionalValue3, 'value:5')
  assertEquals(values2.numberString, '5')
})
