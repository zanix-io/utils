import { assertEquals, assertMatch, assertStringIncludes, assertThrows } from '@std/assert'
import { ApplicationError } from 'modules/errors/main.ts'
import {
  assertZnxCookieName,
  PUBLIC_COOKIE_ATTRIBUTES,
  SESSION_COOKIE_ATTRIBUTES,
} from 'utils/cookies.ts'

/**
 * Regression coverage for a confirmed vulnerability: session/token cookies were built without
 * `Secure`, so a browser would still attach them over a plain-HTTP connection — meaningfully
 * widening exposure to interception (e.g. on a network path that isn't fully HTTPS end to end).
 */
Deno.test('SESSION_COOKIE_ATTRIBUTES always includes Secure, HttpOnly, and SameSite=Strict', () => {
  assertStringIncludes(SESSION_COOKIE_ATTRIBUTES, 'Secure')
  assertStringIncludes(SESSION_COOKIE_ATTRIBUTES, 'HttpOnly')
  assertStringIncludes(SESSION_COOKIE_ATTRIBUTES, 'SameSite=Strict')
  assertStringIncludes(SESSION_COOKIE_ATTRIBUTES, 'Path=/')
})

Deno.test('SESSION_COOKIE_ATTRIBUTES is a real, appendable cookie attribute string', () => {
  const cookie = `session=abc123; ${SESSION_COOKIE_ATTRIBUTES}`
  assertMatch(cookie, /^session=abc123; Path=\/; HttpOnly; Secure; SameSite=Strict$/)
})

/**
 * Regression coverage for a confirmed real inconsistency: `@zanix/space`'s `langGuard`/
 * `langPreHandler`/`populationGuard` each hand-rolled `'Path=/; SameSite=Lax'` independently, and
 * all three were missing `Secure` — the only place in a full 12-repo audit that omitted it.
 */
Deno.test('PUBLIC_COOKIE_ATTRIBUTES includes Secure and SameSite=Lax, but never HttpOnly', () => {
  assertStringIncludes(PUBLIC_COOKIE_ATTRIBUTES, 'Secure')
  assertStringIncludes(PUBLIC_COOKIE_ATTRIBUTES, 'SameSite=Lax')
  assertStringIncludes(PUBLIC_COOKIE_ATTRIBUTES, 'Path=/')
  assertEquals(PUBLIC_COOKIE_ATTRIBUTES.includes('HttpOnly'), false)
})

Deno.test('PUBLIC_COOKIE_ATTRIBUTES is a real, appendable cookie attribute string', () => {
  const cookie = `X-Znx-Lang=en; ${PUBLIC_COOKIE_ATTRIBUTES}`
  assertMatch(cookie, /^X-Znx-Lang=en; Path=\/; Secure; SameSite=Lax$/)
})

Deno.test('assertZnxCookieName: does not throw for a valid X-Znx-prefixed name', () => {
  assertZnxCookieName('X-Znx-Csrf', 'csrfGuard')
  assertZnxCookieName('X-Znx-Lang', 'langPreHandler')
})

Deno.test('assertZnxCookieName: throws with the right code for a missing prefix', () => {
  assertThrows(() => assertZnxCookieName('session', 'csrfGuard'), ApplicationError)
  const error = assertThrows(() => assertZnxCookieName('Znx-Csrf', 'csrfGuard'), ApplicationError)
  assertEquals(error.code, 'UTILS_COOKIES_INVALID_PREFIX')
})

Deno.test('assertZnxCookieName: does not throw when mustContain is satisfied', () => {
  assertZnxCookieName('X-Znx-Csrf', 'csrfGuard', 'Csrf')
  assertZnxCookieName('X-Znx-Custom-Csrf-Token', 'csrfGuard', 'Csrf')
})

Deno.test('assertZnxCookieName: throws with the right code when mustContain is missing', () => {
  const error = assertThrows(
    () => assertZnxCookieName('X-Znx-Custom-Token', 'csrfGuard', 'Csrf'),
    ApplicationError,
  )
  assertEquals(error.code, 'UTILS_COOKIES_MISSING_KEYWORD')
})

Deno.test('assertZnxCookieName: mustContain check is case-insensitive', () => {
  assertZnxCookieName('X-Znx-csrf', 'csrfGuard', 'Csrf')
  assertZnxCookieName('X-Znx-CSRF', 'csrfGuard', 'csrf')
  assertZnxCookieName('X-Znx-Custom-CSRF-Cookie', 'csrfGuard', 'csrf')
})
