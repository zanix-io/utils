import type { HttpErrorCodes } from 'typings/errors.ts'

import { assertEquals, assertExists } from '@std/assert'
import { HttpError } from 'modules/errors/main.ts'
import httpErrorStates from 'modules/errors/http-status-codes.ts'
import { serializeError, serializeMultipleErrors } from 'modules/errors/serialize.ts'

const validateCommonError = (
  code: HttpErrorCodes,
  options?: { message?: string | undefined; cause?: unknown },
) => {
  const error = new HttpError(code, options)
  assertEquals(error.message, options?.message || code)
  assertEquals(error.status, { code: code, value: httpErrorStates[code] })
  assertExists(error.stack)
  assertEquals(options?.cause, error.cause)
}

Deno.test('Validates http error instances', () => {
  // Basic error validation
  Object.keys(httpErrorStates).forEach((key) => {
    validateCommonError(key as HttpErrorCodes)
  })

  // Custom message error validation
  validateCommonError('CONFLICT', { message: 'My Custom Message' })

  // Custom message error validation with some cause
  validateCommonError('BAD_GATEWAY', { message: 'My Custom Message', cause: 'unknown' })
})

Deno.test('Validates error serialization', () => {
  const error = new HttpError('BAD_GATEWAY')
  const serialized = serializeError(error)
  delete serialized.stack
  const result = serializeMultipleErrors([error])
  delete result[0].stack
  assertEquals(result[0], serialized)
})
