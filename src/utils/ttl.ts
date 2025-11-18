/**
 * Parses a human-readable time duration (e.g., `"1h"`, `"30m"`, `"7d"`) or a numeric
 * value representing seconds, and returns the duration in seconds.
 *
 * Supported units:
 * - `s`  → seconds
 * - `m`  → minutes
 * - `h`  → hours
 * - `d`  → days
 * - `w`  → weeks
 * - `mo` → months (30 days)
 * - `y`  → years (365 days)
 *
 * If a number is provided, it is assumed to already represent seconds.
 *
 * @param {string | number} input - The duration to parse, either as a human-readable
 *   string (e.g., `"1h"`, `"15m"`, `"7d"`) or a numeric value in seconds.
 *
 * @returns {number} The parsed duration in seconds.
 *
 * @throws {Error} If the provided string does not match a valid TTL pattern.
 *
 * @example
 * parseTTL("1h")   // → 3600
 * parseTTL("15m")  // → 900
 * parseTTL(300)    // → 300
 *
 * @example
 * // Using with JWT:
 * const expiresIn = parseTTL("7d");
 * jwt.sign(payload, secret, { expiresIn });
 */
export function parseTTL(input: number | string): number {
  if (typeof input === 'number') return input

  const clean = input.trim().replace(/\s+/g, '')

  const match = /^(\d+)(s|m|h|d|w|mo|y)$/.exec(clean)
  if (!match) throw new Error(`Invalid TTL format: ${input}`)

  const value = Number(match[1])
  const unit = match[2]

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
    mo: 2592000,
    y: 31536000,
  }

  return value * multipliers[unit]
}
