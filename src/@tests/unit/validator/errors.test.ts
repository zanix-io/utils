import type { ValidationError } from 'typings/validations.ts'

import { errorValidationFormatting } from 'modules/validations/errors.ts'
import { assertEquals } from '@std/assert'

Deno.test('errorValidationFormatting - handles empty errors array', () => {
  const result = errorValidationFormatting([])
  assertEquals(result, {})
})

Deno.test('errorValidationFormatting - ignores undefined errors', () => {
  const result = errorValidationFormatting([undefined])
  assertEquals(result, {})
})

Deno.test('errorValidationFormatting - formats simple validation error', () => {
  const errors: ValidationError[] = [
    {
      property: 'name',
      constraints: ['Name should not be empty'],
      value: '',
      plainValue: 'empty',
      target: undefined as never,
    },
  ]

  const expected = {
    name: [{
      constraints: ['Name should not be empty'],
      value: '',
      plainValue: 'empty',
    }],
  }

  assertEquals(errorValidationFormatting(errors), expected)
})

Deno.test('errorValidationFormatting - handles nested validation errors', () => {
  const errors: ValidationError[] = [
    {
      property: 'user',
      constraints: ['main nested error'],
      children: [
        {
          property: 'email',
          constraints: ['Invalid email format'],
          value: 'invalid-email',
          plainValue: 'invalid-email',
          target: undefined as never,
        },
      ],
      target: undefined as never,
      value: undefined,
    },
  ]

  const expected = {
    user: {
      message: 'main nested error',
      properties: {
        email: [{
          constraints: ['Invalid email format'],
          value: 'invalid-email',
          plainValue: 'invalid-email',
        }],
      },
    },
  }

  assertEquals(errorValidationFormatting(errors), expected)
})
