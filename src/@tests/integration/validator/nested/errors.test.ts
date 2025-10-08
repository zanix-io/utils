// deno-lint-ignore-file no-explicit-any

import { classValidation } from 'modules/validations/main.ts'
import { assertEquals, assertRejects } from '@std/assert'
import { ValidateNestedDefaultArrayRTO, ValidateNestedRTO } from '../rtos/nested.ts'

Deno.test('Nested RTO required validations errors', async () => {
  const error: any = {}
  await assertRejects(
    () =>
      classValidation(ValidateNestedRTO, {}).catch((err) => {
        Object.assign(error, err.cause)
        throw err
      }),
  )

  assertEquals(Object.keys(error.properties).length, 1)
  assertEquals(error.message, 'Request validation error')
  assertEquals(error.properties.NumbersRequired, {
    message:
      "Nested property 'NumbersRequired' from target 'ValidateNestedRTO' must be follow validation rules.",
    properties: {
      NumbersRequired: [
        {
          constraints: ["The 'NumbersRequired' property must be defined."],
          value: undefined,
          plainValue: undefined,
        },
      ],
    },
  })
  assertEquals(error.target, 'ValidateNestedRTO')
})

Deno.test('Nested RTO default array validations errors', async () => {
  const error: any = {}
  await assertRejects(
    () =>
      classValidation(ValidateNestedDefaultArrayRTO, {
        NumbersDefaultArray: [{}],
      }).catch((err) => {
        Object.assign(error, err.cause)
        throw err
      }),
  )

  assertEquals(Object.keys(error.properties).length, 1)
  assertEquals(error.properties.NumbersDefaultArray, {
    message:
      "Nested property 'NumbersDefaultArray' from target 'ValidateNestedDefaultArrayRTO' must be follow validation rules.",
    properties: {
      numberValue: [
        {
          constraints: ["'numberValue' must be a valid numeric string."],
          value: undefined,
          plainValue: undefined,
        },
      ],
    },
  })
  assertEquals(error.message, 'Request validation error')
  assertEquals(error.target, 'ValidateNestedDefaultArrayRTO')
})

Deno.test('Nested RTO default validations errors', async () => {
  const error: any = {}
  await assertRejects(
    () =>
      classValidation(ValidateNestedRTO, {
        NumbersRequired: { numberValue: '1' },
        NumbersDefault: { numberValue: '43s' },
      }).catch((err) => {
        Object.assign(error, err.cause)
        throw err
      }),
  )

  assertEquals(Object.keys(error.properties).length, 1)
  assertEquals(error.message, 'Request validation error')
  assertEquals(error.properties.NumbersDefault, {
    message:
      "Nested property 'NumbersDefault' from target 'ValidateNestedRTO' must be follow validation rules.",
    properties: {
      numberValue: [
        {
          constraints: ["'numberValue' must be a valid numeric string."],
          value: '43s',
          plainValue: '43s',
        },
      ],
    },
  })
  assertEquals(error.target, 'ValidateNestedRTO')
})

Deno.test('Nested RTO children validation rules', async () => {
  const error: any = {}
  await assertRejects(
    () =>
      classValidation(ValidateNestedRTO, {
        NumbersRequired: {},
      }).catch((err) => {
        Object.assign(error, err.cause)
        throw err
      }),
  )
  assertEquals(error.message, 'Request validation error')
  assertEquals(Object.keys(error.properties).length, 1)
  assertEquals(error.properties.NumbersRequired, {
    message:
      "Nested property 'NumbersRequired' from target 'ValidateNestedRTO' must be follow validation rules.",
    properties: {
      numberValue: [{
        constraints: ["'numberValue' must be a valid numeric string."],
        value: undefined,
        plainValue: undefined,
      }],
    },
  })
})

Deno.test('Nested RTO children validation each array', async () => {
  const error: any = {}
  await assertRejects(
    () =>
      classValidation(ValidateNestedRTO, {
        NumbersRequired: {
          numberValue: '3',
          numbers: ['sd', '4', 3],
        },
      }).catch((err) => {
        Object.assign(error, err.cause)
        throw err
      }),
  )
  assertEquals(error.message, 'Request validation error')
  assertEquals(error.properties.NumbersRequired, {
    message:
      "Nested property 'NumbersRequired' from target 'ValidateNestedRTO' must be follow validation rules.",
    properties: {
      numbers: [{
        constraints: ["All values of 'numbers' must be numerics."],
        value: [undefined, 4, 3],
        plainValue: ['sd', '4', 3],
      }],
    },
  })
})

Deno.test('Nested RTO children validation empty object array', async () => {
  const error: any = {}

  await assertRejects(() =>
    classValidation(ValidateNestedRTO, {
      NumbersRequired: {
        numberValue: '3',
        numbers: ['1', '4', 3],
      },
      NumbersOptionals: [{}],
    }).catch((err) => {
      Object.assign(error, err.cause)
      throw err
    })
  )
  assertEquals(error.message, 'Request validation error')
  assertEquals(error.properties.NumbersOptionals, {
    message:
      "Nested property 'NumbersOptionals' from target 'ValidateNestedRTO' must be follow validation rules.",
    properties: {
      numberValue: [{
        constraints: ["'numberValue' must be a valid numeric string."],
        value: undefined,
        plainValue: undefined,
      }],
    },
  })
})

Deno.test('Nested RTO children validation mix data', async () => {
  const error: any = {}

  await assertRejects(() =>
    classValidation(ValidateNestedRTO, {
      NumbersRequired: {
        numberValue: '3',
        numbers: ['1s', '4', 3],
        minNumber: 1,
      },
      NumbersOptionals: [{ maxNumber: 9 }],
    }).catch((err) => {
      Object.assign(error, err.cause)
      throw err
    })
  )

  assertEquals(error.message, 'Request validation error')
  assertEquals(error.properties.NumbersOptionals, {
    message:
      "Nested property 'NumbersOptionals' from target 'ValidateNestedRTO' must be follow validation rules.",
    properties: {
      numberValue: [{
        constraints: ["'numberValue' must be a valid numeric string."],
        value: undefined,
        plainValue: undefined,
      }],
      maxNumber: [{
        constraints: ["'maxNumber' must be a number less or equal than 3."],
        value: 9,
        plainValue: 9,
      }],
    },
  })
  assertEquals(error.properties.NumbersRequired, {
    message:
      "Nested property 'NumbersRequired' from target 'ValidateNestedRTO' must be follow validation rules.",
    properties: {
      numbers: [{
        constraints: ["All values of 'numbers' must be numerics."],
        value: [undefined, 4, 3],
        plainValue: ['1s', '4', 3],
      }],
      minNumber: [{
        constraints: ["'minNumber' must be a number greater or equal than 3."],
        value: 1,
        plainValue: 1,
      }],
    },
  })
})

Deno.test('Nested RTO multiple levels', async () => {
  const error: any = {}

  await assertRejects(() =>
    classValidation(ValidateNestedRTO, {
      NumbersRequired: {
        numberValue: '3',
        numbers: ['1s', '4', 3],
        minNumber: 1,
      },
      NumbersOptionals: [{ maxNumber: 9 }],
      First: { Second: [{}] },
    }).catch((err) => {
      Object.assign(error, err.cause)
      throw err
    })
  )

  assertEquals(error.message, 'Request validation error')
  assertEquals(
    error.properties.First.message,
    "Nested property 'First' from target 'ValidateNestedRTO' must be follow validation rules.",
  )
  assertEquals(
    error.properties.First.properties.date2,
    [{
      constraints: ["'date2' must be a valid Date object."],
      value: undefined,
      plainValue: undefined,
    }],
  )
  assertEquals(
    error.properties.First.properties.date3,
    [{
      constraints: ["'date3' must be a valid Date object."],
      value: new Date('Invalid Date'),
      plainValue: undefined,
    }],
  )
  assertEquals(
    error.properties.First.properties.Second,
    {
      message:
        "Nested property 'Second' from target 'FirstLevelRTO' must be follow validation rules.",
      properties: {
        stringPropExpose: [
          {
            constraints: [
              "The 'stringPropExpose' property must be defined.",
              "costomized string message for stringPropExpose with value undefined and ctx 'undefined'",
            ],
            value: undefined,
            plainValue: undefined,
          },
        ],
        stringPropWithInizializer: [
          {
            constraints: ["'stringPropWithInizializer' must be a valid string."],
            value: undefined,
            plainValue: undefined,
          },
        ],
        numericSecondLevel: [
          {
            constraints: ["'numericSecondLevel' must be a valid number."],
            value: undefined,
            plainValue: undefined,
          },
        ],
        stringPropArray: [
          {
            constraints: ["All values of 'stringPropArray' must be valid strings"],
            value: [undefined],
            plainValue: undefined,
          },
        ],
      },
    },
  )
})
