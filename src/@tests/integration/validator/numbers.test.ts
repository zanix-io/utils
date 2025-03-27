import { classValidation } from 'modules/validations/mod.ts'
import { assertEquals, assertRejects } from '@std/assert'
import { HttpError } from 'modules/errors/main.ts'
import { NumbersRTO } from './rtos/numbers.ts'

Deno.test('Number validations RTO errors', async () => {
  // Escenario 1 Defaults
  await assertRejects(
    () =>
      classValidation(NumbersRTO, {}).catch((err) => {
        assertEquals(err.cause.message, 'Request validation error')
        assertEquals(Object.keys(err.cause.properties).length, 1)
        assertEquals(err.cause.properties.numberValue, [{
          constraints: ["'numberValue' must be a valid numeric string."],
          value: undefined,
          plainValue: undefined,
        }])
        assertEquals(err.cause.target, 'NumbersRTO')
        throw err
      }),
    HttpError,
    'BAD_REQUEST',
  )

  // Escenario 2, Invalid number string
  await assertRejects(
    () =>
      classValidation(NumbersRTO, { stringNumber: 'text', numberValue: '4' }).catch((err) => {
        assertEquals(err.cause.message, 'Request validation error')
        assertEquals(Object.keys(err.cause.properties).length, 1)
        assertEquals(err.cause.properties.stringNumber, [{
          constraints: ["'stringNumber' must be a valid numeric string."],
          value: 'text',
          plainValue: 'text',
        }])
        assertEquals(err.cause.target, 'NumbersRTO')
        throw err
      }),
    HttpError,
    'BAD_REQUEST',
  )

  // Escenario 3, Invalid number string
  await assertRejects(
    () =>
      classValidation(NumbersRTO, { numberValue: '4s' }).catch((err) => {
        assertEquals(err.cause.message, 'Request validation error')
        assertEquals(Object.keys(err.cause.properties).length, 1)
        assertEquals(err.cause.properties.numberValue, [{
          constraints: ["'numberValue' must be a valid numeric string."],
          value: '4s',
          plainValue: '4s',
        }])
        assertEquals(err.cause.target, 'NumbersRTO')
        throw err
      }),
    HttpError,
    'BAD_REQUEST',
  )

  // Escenario 4, Invalid number
  await assertRejects(
    () =>
      classValidation(NumbersRTO, { numberValue: '4', numberA: '3d' }).catch((err) => {
        assertEquals(err.cause.message, 'Request validation error')
        assertEquals(Object.keys(err.cause.properties).length, 1)
        assertEquals(err.cause.properties.numberA, [{
          constraints: ["'numberA' must be a valid number."],
          value: undefined,
          plainValue: '3d',
        }])
        assertEquals(err.cause.target, 'NumbersRTO')
        throw err
      }),
    HttpError,
    'BAD_REQUEST',
  )

  // Escenario 5, Invalid number array
  await assertRejects(
    () =>
      classValidation(NumbersRTO, { numberValue: '4', numbers: [3, '4d'] }).catch((err) => {
        assertEquals(err.cause.message, 'Request validation error')
        assertEquals(Object.keys(err.cause.properties).length, 1)
        assertEquals(err.cause.properties.numbers, [{
          constraints: ["All values of 'numbers' must be numerics."],
          value: [3, undefined],
          plainValue: [3, '4d'],
        }])
        assertEquals(err.cause.target, 'NumbersRTO')
        throw err
      }),
    HttpError,
    'BAD_REQUEST',
  )

  // Escenario 6, Invalid max num
  await assertRejects(
    () =>
      classValidation(NumbersRTO, { numberValue: '4', maxNumber: 4 }).catch((err) => {
        assertEquals(err.cause.message, 'Request validation error')
        assertEquals(Object.keys(err.cause.properties).length, 1)
        assertEquals(err.cause.properties.maxNumber, [{
          constraints: ["'maxNumber' must be a number less or equal than 3."],
          value: 4,
          plainValue: 4,
        }])
        assertEquals(err.cause.target, 'NumbersRTO')
        throw err
      }),
    HttpError,
    'BAD_REQUEST',
  )

  // Escenario 6, Invalid min num
  await assertRejects(
    () =>
      classValidation(NumbersRTO, { numberValue: '4', minNumber: '2', numbersDefault: ['2s', 1] })
        .catch((err) => {
          assertEquals(err.cause.message, 'Request validation error')
          assertEquals(Object.keys(err.cause.properties).length, 2)
          assertEquals(err.cause.properties.minNumber, [{
            constraints: ["'minNumber' must be a number greater or equal than 3."],
            value: 2,
            plainValue: '2',
          }])
          assertEquals(err.cause.properties.numbersDefault, [{
            constraints: ["All values of 'numbersDefault' must be numerics."],
            value: [undefined, 1],
            plainValue: ['2s', 1],
          }])
          assertEquals(err.cause.target, 'NumbersRTO')
          throw err
        }),
    HttpError,
    'BAD_REQUEST',
  )
})

Deno.test('Number validations RTO', async () => {
  // Escenario 1
  const resp1 = await classValidation(NumbersRTO, { numberValue: '5' })

  assertEquals(resp1.numbersDefault, [1, 2, 3])
  assertEquals(resp1.numberValue, '5')
  assertEquals(resp1.stringNumber, '1') // Default

  // Escenario 2
  const resp2 = await classValidation(NumbersRTO, { numberValue: '4', stringNumber: '2' })

  assertEquals(resp2.numberValue, '4')
  assertEquals(resp2.stringNumber, '2')

  // Escenario 3 Numeric type
  const resp3 = await classValidation(NumbersRTO, { numberValue: '4', numberA: '3' })

  assertEquals(resp3.numberValue, '4')
  assertEquals(resp3.numberA, 3)

  // Escenario 4 Numeric type array
  const resp4 = await classValidation(NumbersRTO, { numberValue: '4', numbers: ['3', '4', '5'] })

  assertEquals(resp4.numberValue, '4')
  assertEquals(resp4.numbers, [3, 4, 5])

  // Escenario 5 min number
  const resp5 = await classValidation(NumbersRTO, {
    numberValue: '4',
    minNumber: '4',
    valueOptional: 5,
  })

  assertEquals(resp5.numberValue, '4')
  assertEquals(resp5.minNumber, 4)
  assertEquals(resp5.valueOptional, 5)

  // Escenario 6 max number
  const resp6 = await classValidation(NumbersRTO, { numberValue: '4', minNumber: '5' })

  assertEquals(resp6.numberValue, '4')
  assertEquals(resp6.minNumber, 5)
  assertEquals(resp6.valueOptional, 3)

  // Number arrays
  const resp7 = await classValidation(NumbersRTO, { numberValue: '3', numbersDefault: [4, 3, 5] })

  assertEquals(resp7.numbersDefault, [4, 3, 5])
})
