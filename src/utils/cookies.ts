import { ApplicationError } from 'modules/errors/main.ts'

/**
 * The baseline attribute set every Zanix session/token cookie is built with: confined to the
 * whole app (`Path=/`), inaccessible to JavaScript (`HttpOnly`), sent only over HTTPS (`Secure`),
 * and never attached to a cross-site request (`SameSite=Strict`) — the same defensive posture for
 * every cookie that carries a session or token value, wherever in the ecosystem it's built. One
 * shared constant so that posture can't quietly drift between packages that each build their own
 * `Set-Cookie` string.
 *
 * `Secure` is safe even for local development over plain HTTP: browsers treat `localhost` as a
 * secure context regardless, so a `Secure` cookie still round-trips there.
 *
 * @example
 * ```ts
 * `${name}=${value}; ${SESSION_COOKIE_ATTRIBUTES}`
 * `${name}=${value}; Max-Age=${maxAge}; ${SESSION_COOKIE_ATTRIBUTES}`
 * ```
 *
 * @category helpers
 */
export const SESSION_COOKIE_ATTRIBUTES = 'Path=/; HttpOnly; Secure; SameSite=Strict'

/**
 * The baseline attribute set for a Zanix cookie that carries a client-readable, non-session value
 * — confined to the whole app (`Path=/`), sent only over HTTPS (`Secure`), but deliberately
 * WITHOUT `HttpOnly` (client-side JS must be able to read it) and with `SameSite=Lax` rather than
 * `Strict` (it must still be attached on a normal top-level cross-site navigation — e.g. a
 * bookmark or an external link landing on a `/es/...`-prefixed URL still needs the persisted
 * preference recognized on that very first request, which `Strict` would drop). The same posture
 * for every cookie that persists a client-visible preference rather than a session/token, wherever
 * in the ecosystem it's built — one shared constant so it can't quietly drift between packages,
 * the same reasoning as {@linkcode SESSION_COOKIE_ATTRIBUTES} for its own, stricter class of
 * cookie.
 *
 * Real consumers: `@zanix/space`'s `langGuard`/`langPreHandler` (`X-Znx-Lang`) and
 * `populationGuard` (`X-Znx-Population`) — both persist a user-visible preference that client-side
 * JS also reads directly, and both must survive a top-level cross-site navigation.
 *
 * `Secure` is safe even for local development over plain HTTP: browsers treat `localhost` as a
 * secure context regardless, so a `Secure` cookie still round-trips there.
 *
 * @example
 * ```ts
 * `${name}=${value}; ${PUBLIC_COOKIE_ATTRIBUTES}`
 * `${name}=${value}; Max-Age=${maxAge}; ${PUBLIC_COOKIE_ATTRIBUTES}`
 * ```
 *
 * @category helpers
 */
export const PUBLIC_COOKIE_ATTRIBUTES = 'Path=/; Secure; SameSite=Lax'

/**
 * Asserts that a cookie name a Zanix package is about to use follows the ecosystem-wide
 * framework-cookie convention: every framework-owned HTTP cookie must be named
 * `X-Znx-<PascalCase>-...`. This isn't just a naming preference — `@zanix/server`'s own
 * `cookiesGuard` silently drops any cookie outside that prefix from `ctx.cookies` before any
 * guard/handler ever runs (no error, no warning), so a misnamed cookie becomes invisible in
 * production instead of failing loudly where the mistake was actually made.
 *
 * Meant to be called exactly once, at construction time (e.g. inside a guard/pre-handler factory
 * that accepts a customizable `cookieName` option), never per-request — it validates a name, not
 * a live request, and re-checking the same already-validated name on every request is wasted work.
 *
 * The optional `mustContain` guards a second, narrower concern: some cookie names are also relied
 * on by a fuzzy, keyword-based redaction match (e.g. `@zanix/utils`'s own sensitive-key pattern
 * recognizing any cookie name containing `Csrf`) so the cookie still gets redacted from logs even
 * after a consumer customizes its name away from the default. Passing the keyword that redaction
 * depends on here enforces — at the point the name is chosen — that the customization can never
 * silently break that guarantee.
 *
 * @param name - The resolved cookie name to validate: the caller's own customized value, or
 *   whatever default it falls back to.
 * @param sourceName - The caller's own identifying name (e.g. `'csrfGuard'`, `'langPreHandler'`),
 *   used only to make the thrown error's message point at the right place.
 * @param mustContain - Optional, case-insensitive substring `name` must contain — for a cookie
 *   name that a fuzzy redaction/matching rule elsewhere depends on staying recognizable even after
 *   customization.
 * @throws {ApplicationError} If `name` doesn't start with `X-Znx-`.
 * @throws {ApplicationError} If `mustContain` is given and `name` doesn't contain it.
 *
 * @example
 * ```ts
 * assertZnxCookieName('X-Znx-Csrf', 'csrfGuard', 'Csrf') // does not throw
 * assertZnxCookieName('X-Znx-Custom-Csrf-Token', 'csrfGuard', 'Csrf') // does not throw
 * assertZnxCookieName('session', 'csrfGuard') // throws — missing the `X-Znx-` prefix
 * assertZnxCookieName('X-Znx-Custom-Token', 'csrfGuard', 'Csrf') // throws — missing "Csrf"
 * ```
 *
 * @category helpers
 */
export function assertZnxCookieName(name: string, sourceName: string, mustContain?: string): void {
  if (!name.startsWith('X-Znx-')) {
    // The caller (whoever configured `sourceName`'s cookie name) chose an invalid value — not
    // something outside its control, so `ApplicationError` (shouldLog:false by default), not
    // `InternalError`, which would auto-log every failure of this constructor-time validator.
    throw new ApplicationError(
      `Invalid cookie name for ${sourceName}: "${name}" must start with "X-Znx-"`,
      {
        code: 'UTILS_COOKIES_INVALID_PREFIX',
        meta: { name, sourceName },
      },
    )
  }

  if (mustContain && !name.toLowerCase().includes(mustContain.toLowerCase())) {
    throw new ApplicationError(
      `Invalid cookie name for ${sourceName}: "${name}" must contain "${mustContain}"`,
      {
        code: 'UTILS_COOKIES_MISSING_KEYWORD',
        meta: { name, sourceName, mustContain },
      },
    )
  }
}
