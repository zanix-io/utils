import type { ErrorOptions, HttpErrorCodes } from 'typings/errors.ts'

import { assert, assertEquals, assertExists, assertFalse } from '@std/assert'
import { HttpError, InternalError } from 'modules/errors/main.ts'
import httpErrorStates from 'modules/errors/http-status-codes.ts'
import { serializeError, serializeMultipleErrors } from 'modules/errors/serialize.ts'

const validateHttpError = (
  code: HttpErrorCodes,
  options?: ErrorOptions,
) => {
  const error = new HttpError(code, options)
  assertEquals(error.message, options?.message || code)
  assertEquals(error.status, { code: code, value: httpErrorStates[code] })
  assertExists(error.stack)
  assertEquals(error.cause, options?.cause)
  assertEquals(error.meta, options?.meta)
  assertEquals(error.code, options?.code)
}

const validateInternalError = (
  message: string,
  options?: Omit<ErrorOptions, 'message'>,
) => {
  const error = new InternalError(message, options)
  assertEquals(error.message, message)
  assertExists(error.stack)
  assertEquals(error.cause, options?.cause)
  assertEquals(error.meta, options?.meta)
  assertEquals(error.code, options?.code)
}

Deno.test('Validates http error instances', () => {
  // Basic error validation
  Object.keys(httpErrorStates).forEach((key) => {
    validateHttpError(key as HttpErrorCodes)
  })

  // Custom message error validation
  validateHttpError('CONFLICT', { message: 'My Custom Message' })

  // Custom message error validation with some cause
  validateHttpError('BAD_GATEWAY', { message: 'My Custom Message', cause: 'unknown' })

  // Error with code and meta options
  validateHttpError('CONFLICT', { code: 'ERROR_CODE', meta: { data: 'informative' } })
})

Deno.test('Validates internal error instances', () => {
  // Custom message error validation
  validateInternalError('My Custom Message')

  // Custom message error validation with some cause
  validateInternalError('My Custom Message', { cause: 'unknown' })

  // Error with code and meta options
  validateInternalError('An error ocurred', { code: 'ERROR_CODE', meta: { data: 'informative' } })
})

Deno.test('Validates error serialization', () => {
  const error = new HttpError('BAD_GATEWAY')
  const serialized = serializeError(error)
  delete serialized.stack
  const result = serializeMultipleErrors([error])
  delete result[0].stack
  assertEquals(result[0], serialized)
})

Deno.test('Validates private fields', () => {
  console.error = () => {}
  const error = new HttpError('BAD_GATEWAY')
  const serialized = serializeError(error)
  assertFalse('_logged' in serialized)
  assert('_logged' in error)
})

Deno.test('Validates serialization without stack trace', () => {
  console.error = () => {}
  const error = new HttpError('BAD_GATEWAY')
  const serialized = serializeError(error, { withStackTrace: false })
  assertFalse('stack' in serialized)
})
