import { classValidation } from 'modules/validations/main.ts'
import { ValidateNestedRTO } from '../rtos/nested.ts'
import { assertEquals } from '@std/assert'

Deno.test('Nested RTO first level data with defaults and array', async () => {
  const data1 = await classValidation(ValidateNestedRTO, {
    NumbersRequired: { numberValue: '4' },
    NumbersOptionals: [{ numberValue: '443', stringNumber: '3' }, {
      numberValue: '442',
    }],
  })

  assertEquals(data1.NumbersDefault?.stringNumber, '1')
  assertEquals(data1.NumbersDefault?.numberValue, '31')
  assertEquals(data1.NumbersDefault?.valueOptional, 3)
  assertEquals(data1.NumbersRequired.stringNumber, '1')
  assertEquals(data1.NumbersRequired.numberValue, '4')
  assertEquals(data1.NumbersOptionals?.[0].stringNumber, '3')
  assertEquals(data1.NumbersOptionals?.[0].numberValue, '443')
  assertEquals(data1.NumbersOptionals?.[1].stringNumber, '1')
  assertEquals(data1.NumbersOptionals?.[1].numberValue, '442')

  const data2 = await classValidation(ValidateNestedRTO, {
    NumbersRequired: { numberValue: '2', stringNumber: '4' },
    NumbersOptionals: [{ numberValue: '443' }, {
      numberValue: '442',
      stringNumber: '3',
    }],
    NumbersDefault: { numberValue: '2', valueOptional: 1, stringNumber: '4' },
  })

  assertEquals(data2.NumbersDefault?.stringNumber, '4')
  assertEquals(data2.NumbersDefault?.numberValue, '2')
  assertEquals(data2.NumbersDefault?.valueOptional, 1)
  assertEquals(data2.NumbersRequired.stringNumber, '4')
  assertEquals(data2.NumbersRequired.numberValue, '2')
  assertEquals(data2.NumbersOptionals?.[0].stringNumber, '1')
  assertEquals(data2.NumbersOptionals?.[0].numberValue, '443')
  assertEquals(data2.NumbersOptionals?.[1].stringNumber, '3')
  assertEquals(data2.NumbersOptionals?.[1].numberValue, '442')

  // Default no required
  const data3 = await classValidation(ValidateNestedRTO, {
    NumbersRequired: { numberValue: '2' },
    NumbersDefault: { valueOptional: 2, stringNumber: '21' },
  })

  assertEquals(data3.NumbersDefault?.stringNumber, '21')
  assertEquals(data3.NumbersDefault?.numberValue, '31')
  assertEquals(data3.NumbersDefault?.valueOptional, 2)
})

Deno.test('Nested RTO multiple levels and full data', async () => {
  const data = await classValidation(ValidateNestedRTO, {
    NumbersRequired: {
      numberValue: '3',
      numbers: ['1', '4', 3],
      minNumber: 5,
    },
    NumbersOptionals: [{ numberValue: '9' }],
    First: {
      date2: '2020-01-01',
      date3: '2010-01-01',
      Second: [{
        stringPropExpose: 'value1',
        stringPropWithInizializer: 'value 2',
        numericSecondLevel: '3',
        stringPropArray: ['value 1', 'value 2'],
        extraneus: 'extraneus',
      }],
    },
    NumbersDefault: { stringNumber: '4' },
    extraneus: 'extraneus',
  })

  assertEquals(data['extraneus' as never], undefined)
  assertEquals(data.NumbersDefault?.stringNumber, '4')
  assertEquals(data.NumbersRequired.numberValue, '3')
  assertEquals(data.NumbersRequired.numbers, [1, 4, 3])
  assertEquals(data.NumbersRequired.minNumber, 5)
  assertEquals(data.NumbersRequired.stringNumber, '1')
  assertEquals(data.NumbersOptionals?.[0].numberValue, '9')
  assertEquals(data.First?.date2, new Date('2020-01-01'))
  assertEquals(data.First?.date3, new Date('2010-01-01'))
  assertEquals(data.First?.Second[0].stringPropWithDefaults, 'default value')
  assertEquals(data.First?.Second[0].stringPropExpose, 'value1')
  assertEquals(data.First?.Second[0].stringPropWithInizializer, 'value 2')
  assertEquals(data.First?.Second[0].numericSecondLevel, 3)
  assertEquals(data.First?.Second[0].stringPropArray, ['value 1', 'value 2'])
  assertEquals(data.First?.Second[0]['extraneus' as never], undefined)

  const data2 = await classValidation(ValidateNestedRTO, {
    NumbersRequired: { numberValue: '3' },
    First: {
      date2: '2020-01-01',
      date3: '2010-01-01',
      Second: [{
        stringPropWithDefaults: 'altered default',
        stringPropExpose: 'value1',
        stringPropWithInizializer: 'value 2',
        numericSecondLevel: '3',
        stringPropArray: ['value 1', 'value 2'],
      }],
    },
  })

  assertEquals(data2.First?.Second[0].stringPropWithDefaults, 'altered default')
})
