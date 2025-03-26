import { classValidation } from 'modules/validations/mod.ts'
import { assertEquals, assertRejects } from '@std/assert'
import { HttpError } from 'modules/errors/main.ts'
import { DatesRTO } from './rtos/dates.ts'
import { searchParamsPropertyDescriptor } from 'utils/urls.ts'

Deno.test('Dates validations RTO errors', async () => {
  await assertRejects(
    () =>
      classValidation(DatesRTO, {}).catch((err) => {
        assertEquals(err.cause.message, 'Request validation error')
        assertEquals(Object.keys(err.cause.properties).length, 2)
        assertEquals(err.cause.properties.date2, [{
          constraints: [`'date2' must be a valid Date object.`],
          value: undefined,
          plainValue: undefined,
        }])
        assertEquals(err.cause.properties.date3, [{
          constraints: [`'date3' must be a valid Date object.`],
          value: new Date('Invalid Date'),
          plainValue: undefined,
        }])
        assertEquals(err.cause.target, 'DatesRTO')
        throw err
      }),
    HttpError,
    'BAD_REQUEST',
  )

  // invalid date
  await assertRejects(
    () =>
      classValidation(DatesRTO, {
        date2: '2020-01-01',
        date3: '2024-21-01',
      }).catch((err) => {
        assertEquals(err.cause.message, 'Request validation error')
        assertEquals(Object.keys(err.cause.properties).length, 1)
        assertEquals(err.cause.properties.date3, [{
          constraints: ["'date3' must be a valid Date object."],
          value: new Date('Invalid Date'),
          plainValue: '2024-21-01',
        }])
        throw err
      }),
    HttpError,
    'BAD_REQUEST',
  )

  // invalid array of dates
  await assertRejects(
    () =>
      classValidation(DatesRTO, {
        date2: '2020-01-01',
        date3: '2024-01-01',
        date4: ['2019-01-01', '2018-22-01'],
      }).catch((err) => {
        assertEquals(err.cause.message, 'Request validation error')
        assertEquals(Object.keys(err.cause.properties).length, 1)
        assertEquals(err.cause.properties.date4, [{
          constraints: ["All values of 'date4' must be valid Date objects"],
          value: [new Date('2019-01-01'), new Date('Invalid Date')],
          plainValue: ['2019-01-01', '2018-22-01'],
        }])
        throw err
      }),
    HttpError,
    'BAD_REQUEST',
  )
})

Deno.test('Dates validations RTO', async () => {
  // escenario 1
  const dates1 = await classValidation(DatesRTO, {
    date2: '2020-01-01',
    date3: '2024-01-01',
  })

  assertEquals(dates1.date1.getHours(), new Date().getHours()) // default value
  assertEquals(dates1.date1.getMinutes(), new Date().getMinutes()) // default value
  assertEquals(dates1.date1.getMonth(), new Date().getMonth()) // default value
  assertEquals(dates1.date1.getDate(), new Date().getDate()) // default value
  assertEquals(dates1.date2, new Date('2020-01-01'))
  assertEquals(dates1.date3, new Date('2024-01-01'))

  // escenario 3
  const dates2 = await classValidation(DatesRTO, {
    date1: '2020-01-01',
    date2: '2019-01-01',
    date3: '2018-01-01',
  })

  assertEquals(dates2.date1, new Date('2020-01-01'))
  assertEquals(dates2.date2, new Date('2019-01-01'))
  assertEquals(dates2.date3, new Date('2018-01-01'))

  // escenario 4
  const payload: Record<string, string> = {}
  Object.defineProperty(
    payload,
    'search',
    searchParamsPropertyDescriptor(
      new URLSearchParams(
        'date1=2020-01-01&date2=2019-01-01&date3=2018-01-01&date4=2017-01-01&date4=2017-01-02',
      ),
    ),
  )

  const dates3 = await classValidation(DatesRTO, payload.search)

  assertEquals(dates3.date1, new Date('2020-01-01'))
  assertEquals(dates3.date2, new Date('2019-01-01'))
  assertEquals(dates3.date3, new Date('2018-01-01'))
  assertEquals(dates3.date4, [new Date('2017-01-01'), new Date('2017-01-02')])

  // escenario 5
  const dates4 = await classValidation(DatesRTO, {
    date2: '2019-01-01',
    date3: '2018-01-01',
    date4: ['2019-01-01'],
  })

  assertEquals(dates4.date2, new Date('2019-01-01'))
  assertEquals(dates4.date3, new Date('2018-01-01'))
  assertEquals(dates4.date4, [new Date('2019-01-01')])
})

Deno.test('Min and Max Dates validations RTO', async () => {
  // escenario 1
  const dates5 = await classValidation(DatesRTO, {
    date2: '2019-01-01',
    date3: '2018-01-01',
    date5: '2019-01-01',
  })

  assertEquals(dates5.date5, new Date('2019-01-01'))

  // escenario 2
  const dates6 = await classValidation(DatesRTO, {
    date2: '2019-01-01',
    date3: '2018-01-01',
    date6: '2020-01-02',
  })

  assertEquals(dates6.date6, new Date('2020-01-02'))

  // escenario 3
  await assertRejects(
    async () => {
      await classValidation(DatesRTO, {
        date2: '2019-01-01',
        date3: '2018-01-01',
        date5: '2020-01-02',
      }).catch((err) => {
        assertEquals(err.cause.message, 'Request validation error')
        assertEquals(Object.keys(err.cause.properties).length, 1)
        assertEquals(err.cause.properties.date5, [{
          constraints: [
            "'date5' must be a Date earlier than 2020-01-01T00:00:00.000Z.",
          ],
          value: new Date('2020-01-02'),
          plainValue: '2020-01-02',
        }])
        throw err
      })
    },
    HttpError,
    'BAD_REQUEST',
  )

  // escenario 4
  await assertRejects(
    async () => {
      await classValidation(DatesRTO, {
        date2: '2019-01-01',
        date3: '2018-01-01',
        date6: '2019-01-02',
      }).catch((err) => {
        assertEquals(err.cause.message, 'Request validation error')
        assertEquals(Object.keys(err.cause.properties).length, 1)
        assertEquals(err.cause.properties.date6, [{
          constraints: [
            "'date6' must be a Date later than 2020-01-01T00:00:00.000Z.",
          ],
          value: new Date('2019-01-02'),
          plainValue: '2019-01-02',
        }])
        throw err
      })
    },
    HttpError,
    'BAD_REQUEST',
  )
})
