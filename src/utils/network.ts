import { ApplicationError } from 'modules/errors/main.ts'

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
 * The `trustProxyHeader`/`trustedHeaders` contract shared by every guard/helper in the Zanix
 * ecosystem that resolves a client identity from a proxy-forwarded header (an IP allowlist, a
 * rate-limit bucket, an anonymous session id) — declared once here rather than re-declared
 * per consumer, so the same opt-in-and-explicit shape can't quietly drift between them.
 */
export interface ProxyTrustOptions {
  /**
   * Must be explicitly set to `true` to trust `trustedHeaders` (default:
   * `cf-connecting-ip`/`x-real-ip`/`x-forwarded-for`) for resolving the client's identity. Since
   * those headers are fully attacker-controlled unless the deployment's own infrastructure
   * guarantees a trusted proxy overwrites them, leaving this unset never trusts them — each
   * consumer defines its own safe fallback for that case (e.g. one shared bucket/session id, or
   * refusing to start at all when an allowlist was configured without it).
   */
  trustProxyHeader?: boolean
  /**
   * Headers considered trustworthy by the application deployment, when `trustProxyHeader` is
   * `true`. The caller is responsible for ensuring these headers cannot be spoofed by untrusted
   * clients. Defaults to {@linkcode getClientIp}'s own default list.
   */
  trustedHeaders?: string[]
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

/**
 * Guards a value that's about to become its own line in a raw text protocol (an SMTP command, a
 * literal HTTP header line built by hand) against CR/LF injection: a value carrying `\r` or `\n`
 * could otherwise inject extra protocol lines the caller never intended — a silent `Bcc`, a
 * spoofed `From`, a smuggled second command — since the receiving end has no other way to tell
 * where one line ends and the next begins.
 *
 * Only relevant to a value the caller writes out AS a raw line itself. The `Headers`/`Request`
 * APIs already reject embedded CR/LF in a header value on their own, so this is for the lower-level
 * case of composing a protocol line by hand (an SMTP client, a proxied request builder) rather
 * than going through those APIs.
 *
 * @param field Name of the field being checked, used in the thrown error message.
 * @param value Raw value to check.
 * @throws {ApplicationError} If `value` contains `\r` or `\n`.
 *
 * @category helpers
 */
export function assertNoCrlf(field: string, value: string): void {
  if (/[\r\n]/.test(value)) {
    // The caller passed a value with an embedded line break — not something outside its
    // control, so `ApplicationError` (shouldLog:false by default), not `InternalError`, which
    // would auto-log every failure of this hot, low-level validator on construction.
    throw new ApplicationError(`Invalid ${field}: must not contain line breaks`, {
      code: 'UTILS_NETWORK_CRLF_INJECTION',
      meta: { field },
    })
  }
}

/**
 * Fast-rejects a request body BEFORE a single byte of it is read, based solely on a claimed
 * `Content-Length` — either the raw header string (`headers.get('content-length')`) or an
 * already-parsed number, whichever the caller already has on hand. Never the real defense on its
 * own: `Content-Length` is optional (absent under `Transfer-Encoding: chunked`) and fully
 * client-controlled (nothing stops a caller from lying about it), so this is only a cheap early
 * exit for the common case of an honest client that already declared an oversized body — pair it
 * with {@linkcode readBoundedStream}, which enforces the same cap against bytes actually read,
 * for real protection.
 *
 * A missing, empty, or non-numeric `contentLength` is treated as "no claim was made" and never
 * throws — the absence of a usable `Content-Length` is exactly the case {@linkcode readBoundedStream}
 * exists to cover, not this function's concern.
 *
 * @param contentLength - The claimed body size: the raw `Content-Length` header value, an
 * already-parsed number, or `null`/`undefined` when absent.
 * @param maxBytes - The maximum number of bytes the body may declare.
 * @throws {ApplicationError} If `contentLength` parses to a finite number greater than `maxBytes`.
 *
 * @example
 * ```ts
 * assertContentLengthWithinLimit(req.headers.get('content-length'), 10 * 1024 * 1024)
 * ```
 *
 * @category helpers
 */
export function assertContentLengthWithinLimit(
  contentLength: string | number | null | undefined,
  maxBytes: number,
): void {
  if (contentLength === null || contentLength === undefined || contentLength === '') return

  const declaredBytes = typeof contentLength === 'number' ? contentLength : Number(contentLength)

  if (!Number.isFinite(declaredBytes) || declaredBytes <= maxBytes) return

  throw new ApplicationError(
    `Content-Length declares ${declaredBytes} bytes, exceeding the ${maxBytes}-byte limit`,
    {
      code: 'UTILS_NETWORK_CONTENT_LENGTH_TOO_LARGE',
      meta: { declaredBytes, maxBytes },
    },
  )
}

/**
 * Drains `stream` into one `Uint8Array`, rejecting (`ApplicationError`, code
 * `UTILS_NETWORK_BODY_TOO_LARGE`) the instant the REAL, running byte count exceeds `maxBytes` —
 * the actual defense against an unbounded request body/upload exhausting memory, since a claimed
 * `Content-Length` (see {@linkcode assertContentLengthWithinLimit}) is optional and spoofable and
 * can't be trusted alone.
 *
 * The moment the running total crosses `maxBytes`, the reader is cancelled and the stream is torn
 * down immediately — an oversized payload is never fully buffered first just to be thrown away
 * afterwards.
 *
 * Framework-neutral by design: this throws a plain {@linkcode ApplicationError}, never an
 * HTTP-specific error type, so it has no dependency on any particular server framework's error
 * hierarchy. A caller that needs its own framework error (e.g. an HTTP 413) should catch this and
 * construct it from the caught error (or from `maxBytes` directly) — see this function's own
 * `@example`.
 *
 * @param stream - The `ReadableStream<Uint8Array>` to drain — typically a request body.
 * @param maxBytes - The maximum number of bytes to accept. Enforced against bytes actually read,
 * never against a claimed size.
 * @returns The accumulated bytes, once `stream` is fully (and safely) drained.
 * @throws {ApplicationError} Once the accumulated byte count exceeds `maxBytes`.
 *
 * @example Bytes-native usage (e.g. hashing an upload, writing it to disk for a transform)
 * ```ts
 * const bytes = await readBoundedStream(req.body!, maxBytes)
 * ```
 *
 * @example Decoding to text on top (e.g. a JSON/form request body)
 * ```ts
 * const bytes = await readBoundedStream(req.body!, maxBytes)
 * const text = new TextDecoder().decode(bytes)
 * ```
 *
 * @example Translating the framework-neutral error into an HTTP-specific one
 * ```ts
 * try {
 *   assertContentLengthWithinLimit(req.headers.get('content-length'), maxBytes)
 *   return await readBoundedStream(req.body!, maxBytes)
 * } catch (error) {
 *   if (error instanceof ApplicationError) {
 *     throw new HttpError('PAYLOAD_TOO_LARGE', { message: error.message, cause: error })
 *   }
 *   throw error
 * }
 * ```
 *
 * @category helpers
 */
export async function readBoundedStream(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    // deno-lint-ignore no-await-in-loop -- a stream reader is inherently sequential.
    const { done, value } = await reader.read()
    if (done) break

    total += value.byteLength
    if (total > maxBytes) {
      // Tear the stream down immediately — never finish buffering an oversized payload first,
      // the whole point of enforcing the cap DURING the drain rather than after it.
      // deno-lint-ignore no-await-in-loop -- one-time cleanup right before the loop's own throw.
      await reader.cancel().catch(() => {})
      throw new ApplicationError(
        `Request body exceeded the ${maxBytes}-byte limit while streaming`,
        {
          code: 'UTILS_NETWORK_BODY_TOO_LARGE',
          meta: { maxBytes },
        },
      )
    }
    chunks.push(value)
  }

  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return merged
}
