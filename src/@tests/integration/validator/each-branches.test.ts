import { classValidation } from 'modules/validations/mod.ts'
import { assertEquals, assertRejects } from '@std/assert'
import { HttpError } from 'modules/errors/main.ts'
import { EachBranchesRTO } from './rtos/each-branches.ts'

const validData: Partial<EachBranchesRTO> = {
  email: 'test@example.com',
  emails: ['a@example.com', 'b@example.com'],
  uuid: '9b2f0d5b-3a3e-4c2d-b4d6-8e6f5a1c2e79',
  uuids: [
    '9b2f0d5b-3a3e-4c2d-b4d6-8e6f5a1c2e79',
    '9b2f0d5b-3a3e-4c2d-b4d6-8e6f5a1c2379',
  ],
  url: 'http://www.zanix.co',
  urls: ['http://www.zanix.co', 'http://www.zanix.mx'],
  phone: '3333333333',
  phones: ['3333333333', '4444444444'],
  shortString: 'abc',
  shortStrings: ['a', 'bc'],
  lowercase: 'abc',
  lowercases: ['abc', 'def'],
  booleanString: 'true',
  booleanStrings: ['true', 'false'],
  flag: true,
  flags: [true, false],
  list: [1, 2],
  lists: [[1], [2]],
  boundedList: [1, 2],
  enumValue: 'A',
  enumValues: ['A', 'B'],
  maxNumbers: [1, 2, 5],
  minNumbers: [1, 2, 5],
  maxDates: [new Date('2020-01-01')],
  minDates: [new Date('2020-01-02')],
  numberStrings: ['1', '2', '3'],
  unboundedList: [1, 2],
  customValid: 'x',
  customValidEach: ['x', 'y'],
}

Deno.test({
  name: 'EachBranchesRTO - accepts valid values for scalar and each:true properties',
  fn: async () => {
    const instance = await classValidation(EachBranchesRTO, validData)

    assertEquals(instance.email, validData.email)
    assertEquals(instance.emails, validData.emails)
    assertEquals(instance.maxNumbers, validData.maxNumbers)
    assertEquals(instance.minDates, validData.minDates)
  },
})

Deno.test('EachBranchesRTO - rejects invalid each:true array entries', async () => {
  await assertRejects(
    () =>
      classValidation(EachBranchesRTO, {
        ...validData,
        emails: ['not-an-email'],
      }).catch((err) => {
        assertEquals(err.cause.properties.emails, [{
          constraints: [
            "All values of 'emails' must be valid email addresses.",
          ],
          value: ['not-an-email'],
          plainValue: ['not-an-email'],
        }])
        throw err
      }),
    HttpError,
    'BAD_REQUEST',
  )
})

Deno.test('EachBranchesRTO - rejects invalid scalar values', async () => {
  await assertRejects(
    () =>
      classValidation(EachBranchesRTO, { ...validData, uuid: 'not-a-uuid' })
        .catch((err) => {
          assertEquals(err.cause.properties.uuid, [{
            constraints: ["'uuid' must be a valid UUID."],
            value: 'not-a-uuid',
            plainValue: 'not-a-uuid',
          }])
          throw err
        }),
    HttpError,
    'BAD_REQUEST',
  )
})
