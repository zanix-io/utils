## IP utilities

Helpers for working with IPv4 addresses and client IP extraction. They include IPv4 parsing, CIDR range matching, client IP normalization, and extraction of the originating client IP from trusted proxy headers such as `CF-Connecting-IP`, `X-Real-IP`, and `X-Forwarded-For`.

| Symbol                 | Signature                                                               | Description                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `TrustedHeader` (type) | `'cf-connecting-ip' \| 'x-forwarded-for' \| 'x-real-ip'`                | The set of request headers that can be trusted when extracting the client IP.                                               |
| `ParsedCidr` (type)    | `{ network: number; mask: number }`                                     | Parsed representation of an IPv4 CIDR range.                                                                                |
| `ipv4ToInt`            | `(ip: string): number \| undefined`                                     | Converts an IPv4 address into its unsigned 32-bit integer representation. Returns `undefined` for invalid IPv4 addresses.   |
| `parseCidr`            | `(cidr: string): ParsedCidr \| undefined`                               | Parses an IPv4 CIDR (or a single IPv4 address) into its network and subnet mask.                                            |
| `isIpInParsedCidr`     | `(ip: string, cidr: ParsedCidr): boolean`                               | Checks whether an IPv4 address belongs to a previously parsed CIDR.                                                         |
| `isIpInCidr`           | `(ip: string, cidr: string): boolean`                                   | Convenience wrapper that parses the CIDR and checks whether an IPv4 address belongs to it.                                  |
| `normalizeClientIp`    | `(ip: string): string`                                                  | Normalizes a client IP by trimming whitespace, converting IPv4-mapped IPv6 addresses, and removing IPv4 port numbers.       |
| `getClientIp`          | `(headers: Headers, trustedHeaders?: readonly TrustedHeader[]): string` | Extracts the client IP from the first trusted request header, returning `'unknown-ip'` when no trusted header is available. |

```typescript
import { getClientIp, isIpInCidr, normalizeClientIp } from 'jsr:@zanix/utils@[version]/helpers'

const ip = getClientIp(request.headers)

isIpInCidr(ip, '10.0.0.0/8') // true | false

normalizeClientIp('::ffff:192.168.1.10:8080')
// '192.168.1.10'
```
