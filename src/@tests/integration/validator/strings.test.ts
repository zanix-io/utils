import { classValidation } from 'modules/validations/mod.ts'
import { StringsRTO } from './rtos/strings.ts'
import { assertEquals, assertRejects } from '@std/assert'
import { HttpError } from 'modules/errors/main.ts'
import { searchParamsPropertyDescriptor } from 'utils/urls.ts'

Deno.test('Expose validations strings RTO with empty object', async () => {
  await assertRejects(
    () =>
      classValidation(StringsRTO, {}, {
        ctx: { stringPropExpose: 'stringPropExpose context' },
      }).catch((err) => {
        assertEquals(err.cause.message, 'Request validation error')
        assertEquals(err.cause.properties.stringPropExpose, [{
          constraints: [
            "The 'stringPropExpose' property must be defined when exposed. To make it optional, set the corresponding option to true.",
            `costomized string message for stringPropExpose with value undefined and ctx 'stringPropExpose context'`,
          ],
          value: undefined,
          plainValue: undefined,
        }])
        assertEquals(err.cause.properties.stringPropArray, [{
          constraints: ["All values of 'stringPropArray' must be valid strings"],
          value: [undefined],
          plainValue: undefined,
        }])
        assertEquals(err.cause.properties.stringPropWithInizializer, [{
          constraints: ["'stringPropWithInizializer' must be a valid string."],
          value: undefined,
          plainValue: undefined,
        }])

        assertEquals(err.cause.target, 'StringsRTO')

        throw err
      }),
    HttpError,
    'BAD_REQUEST',
  )
})

Deno.test('Expose validations strings RTO with base payload', async () => {
  const payload: Record<string, string> = {}
  Object.defineProperty(
    payload,
    'search',
    searchParamsPropertyDescriptor(
      new URLSearchParams(
        'stringPropExpose=string&stringPropWithInizializer=stringPropWithInizializer&stringPropArray=value1&stringPropArray=value2&extraneusValue=extraneous',
      ),
    ),
  )

  const validatedObj = await classValidation(StringsRTO, payload.search)

  assertEquals(Object.getOwnPropertyNames(validatedObj), [
    'stringPropWithInizializer',
    'stringPropExpose',
    'stringPropWithDefaults',
    'stringPropOptional',
    'stringPropArray',
  ]) // no metadata objects, only properties

  assertEquals(validatedObj.stringPropArray, ['value1', 'value2'])
  assertEquals(validatedObj.stringPropExpose, 'string')
  assertEquals(validatedObj.stringPropWithInizializer, 'stringPropWithInizializer')
  assertEquals(validatedObj.stringPropWithDefaults, 'default value')
  assertEquals(validatedObj.stringPropOptional, undefined)
  assertEquals(validatedObj['extraneusValue' as never], undefined)

  // Changing default value and setiing a context

  const validatedObjDefault = await classValidation(StringsRTO, {
    stringPropExpose: 'string',
    stringPropWithInizializer: 'stringPropWithInizializer',
    stringPropArray: ['value1', 'value2'],
    extraneusValue: 'extraneous',
    stringPropWithDefaults: 'new value',
    stringPropOptional: 'optional',
  }, { ctx: { stringPropExpose: 'other ctx' } })

  assertEquals(validatedObjDefault['context'], undefined) // context should be removed
  assertEquals(validatedObjDefault.stringPropExpose, 'string')
  assertEquals(validatedObjDefault.stringPropWithInizializer, 'stringPropWithInizializer')
  assertEquals(validatedObjDefault.stringPropWithDefaults, 'new value')
  assertEquals(validatedObjDefault.stringPropOptional, 'optional')
  assertEquals(validatedObjDefault['extraneusValue' as never], undefined)
})
