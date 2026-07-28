/**
 * A parsed IPv4 CIDR range.
 *
 * @category helpers
 */
export interface ParsedCidr {
  /**
   * The masked network address.
   */
  network: number

  /**
   * The subnet mask.
   */
  mask: number
}

/**
 * Parses a dotted-quad IPv4 address into its 32-bit unsigned integer representation.
 *
 * Returns `undefined` if the input is not a strictly valid IPv4 address.
 *
 * This helper intentionally supports **IPv4 only**. IPv6 addresses are considered
 * invalid.
 *
 * @param ip - The IPv4 address to parse.
 * @returns The unsigned 32-bit representation of the address, or `undefined`.
 *
 * @example
 * ```ts
 * ipv4ToInt('192.168.1.1')
 * ```
 *
 * @category helpers
 */
export function ipv4ToInt(ip: string): number | undefined {
  const parts = ip.split('.')

  if (parts.length !== 4) return

  let result = 0

  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return

    const value = Number(part)

    if (value > 255) return

    result = (result << 8) | value
  }

  return result >>> 0
}

/**
 * Parses a canonical IPv4 CIDR into its network and subnet mask.
 *
 * A bare IPv4 address is treated as an implicit `/32`.
 *
 * The network address must already match the supplied prefix length.
 *
 * @param cidr - An IPv4 address or CIDR range.
 * @returns The parsed CIDR, or `undefined` if the input is invalid.
 *
 * @example
 * ```ts
 * parseCidr('10.0.0.0/8')
 * parseCidr('203.0.113.5')
 * ```
 *
 * @category helpers
 */

export function parseCidr(cidr: string): ParsedCidr | undefined {
  const parts = cidr.split('/')

  if (parts.length !== 1 && parts.length !== 2) {
    return
  }

  const [networkIp, prefixPart] = parts

  const prefix = prefixPart === undefined ? 32 : Number(prefixPart)

  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return
  }

  const network = ipv4ToInt(networkIp)

  if (network === undefined) return

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0

  const normalizedNetwork = (network & mask) >>> 0

  if (normalizedNetwork !== network) {
    return
  }

  return {
    network: normalizedNetwork,
    mask,
  }
}

/**
 * Determines whether an IPv4 address belongs to a previously parsed CIDR.
 *
 * @param ip - The IPv4 address to test.
 * @param cidr - A parsed CIDR produced by {@link parseCidr}.
 * @returns `true` if the address belongs to the network; otherwise `false`.
 *
 * @category helpers
 */
export function isIpInParsedCidr(
  ip: string,
  cidr: ParsedCidr,
): boolean {
  const ipNum = ipv4ToInt(ip)

  if (ipNum === undefined) return false

  return ((ipNum & cidr.mask) >>> 0) === cidr.network
}

/**
 * Determines whether an IPv4 address belongs to a CIDR range.
 *
 * This is a convenience wrapper around {@link parseCidr} and
 * {@link isIpInParsedCidr}. If the same CIDR is evaluated repeatedly, prefer
 * parsing it once with {@link parseCidr}.
 *
 * @param ip - The IPv4 address to test.
 * @param cidr - An IPv4 address or CIDR range.
 * @returns `true` if the address belongs to the network; otherwise `false`.
 *
 * @example
 * ```ts
 * isIpInCidr('10.0.4.12', '10.0.0.0/8')
 * isIpInCidr('203.0.113.5', '203.0.113.5')
 * ```
 *
 * @category helpers
 */
export function isIpInCidr(
  ip: string,
  cidr: string,
): boolean {
  const parsed = parseCidr(cidr)

  if (!parsed) return false

  return isIpInParsedCidr(ip, parsed)
}

/**
 * Normalizes a client IP extracted from HTTP headers.
 *
 * The normalization currently performs the following:
 *
 * - Trims surrounding whitespace.
 * - Converts IPv4-mapped IPv6 addresses (e.g. `::ffff:192.168.1.1`) into
 *   plain IPv4.
 * - Removes the port from IPv4 addresses (e.g. `192.168.1.1:8080`).
 *
 * IPv6 addresses are preserved unchanged.
 *
 * This helper does not validate that the resulting value is a valid IP address.
 *
 * @param ip - The raw IP value extracted from a request header.
 * @returns The normalized IP string.
 *
 * @category helpers
 */
export function normalizeClientIp(ip: string): string {
  let value = ip.trim()

  if (value.startsWith('::ffff:')) {
    value = value.slice(7)
  }

  const ipv4WithPort = value.match(/^(\d+\.\d+\.\d+\.\d+):\d+$/)

  if (ipv4WithPort) {
    value = ipv4WithPort[1]
  }

  return value
}

/**
 * Extracts the client IP from trusted request headers.
 *
 * The first header present in `trustedHeaders` is used.
 *
 * If `x-forwarded-for` is selected, only the first address is returned, as
 * required by the de facto standard format.
 *
 * This helper **does not verify** whether the headers are trustworthy. It
 * assumes the caller has configured the application behind a trusted reverse
 * proxy or CDN that overwrites these headers.
 *
 * Empty or whitespace-only header values are ignored and the next trusted
 * header is attempted.
 *
 * @param headers - The incoming request headers.
 * @param trustedHeaders - Headers considered trustworthy by the application
 * deployment. The caller is responsible for ensuring these headers cannot be
 * spoofed by untrusted clients.
 * @returns The extracted client IP, or `'unknown-ip'` if no trusted header is
 * present.
 *
 * @example
 * ```ts
 * getClientIp(headers)
 *
 * getClientIp(headers, [
 *   'cf-connecting-ip',
 *   'x-forwarded-for',
 * ])
 * ```
 *
 * @category helpers
 */
export function getClientIp(
  headers: Headers,
  trustedHeaders: readonly string[] = [
    'cf-connecting-ip',
    'x-real-ip',
    'x-forwarded-for',
  ],
): string {
  for (const header of trustedHeaders) {
    const value = headers.get(header)

    if (!value) continue

    const ip = header === 'x-forwarded-for' ? value.split(',')[0] : value

    const normalizedIp = normalizeClientIp(ip)

    if (!normalizedIp) continue

    return normalizedIp
  }

  return 'unknown-ip'
}
