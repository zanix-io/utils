import { assertMatch, assertStringIncludes } from '@std/assert'
import { SESSION_COOKIE_ATTRIBUTES } from 'utils/cookies.ts'

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
