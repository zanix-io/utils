## IP utilities

Helpers for working with IPv4 addresses and client IP extraction. They include
IPv4 parsing, CIDR range matching, client IP normalization, and extraction of
the originating client IP from trusted proxy headers such as `CF-Connecting-IP`,
`X-Real-IP`, and `X-Forwarded-For`.

| Symbol                           | Signature                                                                        | Description                                                                                                                                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TrustedHeader` (type)           | `'cf-connecting-ip' \| 'x-forwarded-for' \| 'x-real-ip'`                         | The set of request headers that can be trusted when extracting the client IP.                                                                                                                  |
| `ParsedCidr` (type)              | `{ network: number; mask: number }`                                              | Parsed representation of an IPv4 CIDR range.                                                                                                                                                   |
| `ipv4ToInt`                      | `(ip: string): number \| undefined`                                              | Converts an IPv4 address into its unsigned 32-bit integer representation. Returns `undefined` for invalid IPv4 addresses.                                                                      |
| `parseCidr`                      | `(cidr: string): ParsedCidr \| undefined`                                        | Parses an IPv4 CIDR (or a single IPv4 address) into its network and subnet mask.                                                                                                               |
| `isIpInParsedCidr`               | `(ip: string, cidr: ParsedCidr): boolean`                                        | Checks whether an IPv4 address belongs to a previously parsed CIDR.                                                                                                                            |
| `isIpInCidr`                     | `(ip: string, cidr: string): boolean`                                            | Convenience wrapper that parses the CIDR and checks whether an IPv4 address belongs to it.                                                                                                     |
| `normalizeClientIp`              | `(ip: string): string`                                                           | Normalizes a client IP by trimming whitespace, converting IPv4-mapped IPv6 addresses, and removing IPv4 port numbers.                                                                          |
| `getClientIp`                    | `(headers: Headers, trustedHeaders?: readonly TrustedHeader[]): string`          | Extracts the client IP from the first trusted request header, returning `'unknown-ip'` when no trusted header is available.                                                                    |
| `ProxyTrustOptions` (type)       | `{ trustProxyHeader?: boolean; trustedHeaders?: string[] }`                      | The `trustProxyHeader`/`trustedHeaders` shape shared by every guard/helper that resolves a client identity from a proxy-forwarded header — declared once so it isn't re-declared per consumer. |
| `assertNoCrlf`                   | `(field: string, value: string): void`                                           | Throws if `value` carries a `\r` or `\n`. See [Helpers → Misc](./helpers.md#misc).                                                                                                             |
| `assertContentLengthWithinLimit` | `(contentLength: string \| number \| null \| undefined, maxBytes: number): void` | Fast-reject on a claimed `Content-Length` alone, before reading the body. See [Helpers → Misc](./helpers.md#misc).                                                                             |
| `readBoundedStream`              | `(stream: ReadableStream<Uint8Array>, maxBytes: number): Promise<Uint8Array>`    | Bounds a request body/upload read against real bytes received, not a claimed size. See [Helpers → Misc](./helpers.md#misc).                                                                    |

```typescript
import { getClientIp, isIpInCidr, normalizeClientIp } from 'jsr:@zanix/utils@[version]/helpers'

const ip = getClientIp(request.headers)

isIpInCidr(ip, '10.0.0.0/8') // true | false

normalizeClientIp('::ffff:192.168.1.10:8080')
// '192.168.1.10'
```

```typescript
import type { ProxyTrustOptions } from 'jsr:@zanix/utils@[version]/helpers'

// A guard that resolves client identity from a proxy header extends this shared shape
// instead of re-declaring `trustProxyHeader`/`trustedHeaders` itself.
export interface MyGuardOptions extends ProxyTrustOptions {
  // ...guard-specific options
}
```
