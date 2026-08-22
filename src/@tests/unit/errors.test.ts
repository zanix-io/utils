import type { ErrorOptions, HttpErrorCodes } from 'typings/errors.ts'

import { assert, assertEquals, assertExists, assertFalse } from '@std/assert'
import { HttpError, InternalError } from 'modules/errors/main.ts'
import httpErrorStates from 'modules/errors/http-status-codes.ts'
import { serializeError, serializeMultipleErrors } from 'modules/errors/serialize.ts'

console.error = () => {}

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
  assertEquals(error.userMessage, options?.userMessage)
  assertEquals(error.exposeMeta, options?.exposeMeta || undefined)
  assertEquals(error.exposeCause, options?.exposeCause || undefined)
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
  assertEquals(error.userMessage, options?.userMessage)
  assertEquals(error.exposeMeta, options?.exposeMeta || undefined)
  assertEquals(error.exposeCause, options?.exposeCause || undefined)
}

Deno.test('Validates http error instances', () => {
  // Basic error validation
  Object.keys(httpErrorStates).forEach((key) => {
    validateHttpError(key as HttpErrorCodes)
  })

  // Custom message error validation
  validateHttpError('CONFLICT', { message: 'My Custom Message' })

  // Custom message error validation with some cause
  validateHttpError('BAD_GATEWAY', {
    message: 'My Custom Message',
    cause: 'unknown',
  })

  // Error with code and meta options
  validateHttpError('CONFLICT', {
    code: 'ERROR_CODE',
    meta: { data: 'informative' },
  })

  // Error with a user-facing message distinct from the technical `message`
  validateHttpError('CONFLICT', {
    message: 'Unique constraint violation on users.email',
    userMessage: 'That email is already registered. Try signing in instead.',
    code: 'USER_EMAIL_TAKEN',
  })

  // A validation-style error whose `meta` is deliberately shaped for the caller to act on
  validateHttpError('UNPROCESSABLE_ENTITY', {
    meta: { field: 'email', reason: 'invalid_format' },
    exposeMeta: true,
    code: 'VALIDATION_FAILED',
  })
})

Deno.test('exposeMeta/exposeCause default to undefined, even with meta/cause set', () => {
  const error = new HttpError('CONFLICT', {
    meta: { internalConnectionId: 'conn-42' },
    cause: new Error('driver-level failure with an internal hostname'),
  })

  assertFalse('exposeMeta' in error)
  assertFalse('exposeCause' in error)
  // The values themselves are untouched — only their client-facing visibility is what's gated
  // elsewhere (`@zanix/server`'s `getPublicErrorResponse`), not this class's own storage of them.
  assertEquals(error.meta, { internalConnectionId: 'conn-42' })
  assertExists(error.cause)
})

Deno.test('Validates internal error instances', () => {
  // Custom message error validation
  validateInternalError('My Custom Message')

  // Custom message error validation with some cause
  validateInternalError('My Custom Message', { cause: 'unknown' })

  // Error with code and meta options
  validateInternalError('An error ocurred', {
    code: 'ERROR_CODE',
    meta: { data: 'informative' },
  })

  // Error with a user-facing message distinct from the technical `message`
  validateInternalError('Postgres pool exhausted (0/20 connections available)', {
    userMessage: "We're having trouble right now. Please try again in a moment.",
    code: 'DB_POOL_EXHAUSTED',
  })
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

Deno.test('_logged can be assigned directly, not just constructed', () => {
  // `HttpError` defaults `shouldLog: false`, so `_logged` starts `false` — the case that matters
  // here: a caller (e.g. `@zanix/server`'s `logAppError`) stamping it `true` AFTER logging the
  // error itself, once, elsewhere. A getter-only accessor with no setter would make this specific
  // assignment either throw (uncaught) or silently no-op (inside a try/catch) — regressing back to
  // that shape is exactly the bug this test locks in against, confirmed as a real, reproducible
  // double-log in `@zanix/server` before this fix (see this property's own doc comment).
  const error = new HttpError('BAD_GATEWAY')
  assertEquals((error as unknown as { _logged: boolean })._logged, false)

  Object.assign(error, { _logged: true })
  assertEquals((error as unknown as { _logged: boolean })._logged, true)

  // Still hidden from enumeration/serialization — the fix only changes mutability, not visibility.
  assertFalse('_logged' in serializeError(error))
})

Deno.test('userMessage is a plain enumerable field — survives serializeError untouched', () => {
  const error = new HttpError('CONFLICT', {
    message: 'Unique constraint violation on users.email',
    userMessage: 'That email is already registered. Try signing in instead.',
  })

  // `SerializeError`'s declared shape (`BaseSerializeError`) only lists `name`/`message`/`stack`/
  // `cause` — same gap `meta`/`code`/`id` already have — so a real extra field like `userMessage`
  // needs the same `Record<string, unknown>` cast every other "field beyond the base shape" check
  // in this file uses; `in` (below) needs no cast, since it's a runtime check either way.
  const serialized = serializeError(error) as Record<string, unknown>
  assertEquals(
    serialized.userMessage,
    'That email is already registered. Try signing in instead.',
  )

  // Absent when never set — no default synthesized from `message` (a safe rewrite has to be
  // explicit; there's no rule that could derive one from arbitrary technical text).
  const withoutUserMessage = new HttpError('CONFLICT')
  assertFalse('userMessage' in withoutUserMessage)
  assertFalse('userMessage' in serializeError(withoutUserMessage))
})

Deno.test('Validates serialization without stack trace', () => {
  console.error = () => {}
  const error = new HttpError('BAD_GATEWAY')
  const serialized = serializeError(error, { withStackTrace: false })
  assertFalse('stack' in serialized)
})
