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
