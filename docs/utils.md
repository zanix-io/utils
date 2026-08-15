# Utils

This guide documents the low-level building blocks shipped by `@zanix/utils`:
binary/string encoding helpers, project-wide constants, and reusable regular
expressions. These symbols have no single dedicated entrypoint — encoders are
re-exported from the `/helpers` subpath, while constants and regular expressions
each ship their own subpath with a frozen default export plus matching named
exports.

Several higher-level features in the library build directly on top of these
primitives. For example, the `IsEmail`, `IsUrl`, and `IsUUID` decorators
documented in [Validator](./validator.md) use `emailRegex`, `urlRegex`, and
`uuidRegex` internally, and the config-loading helpers documented in
[Helpers](./helpers.md) rely on `stripComments` and the `CONFIG_FILE` constant.

## Encoding

Import encoding utilities from the `/helpers` subpath:

```ts
import {
  base32Decode,
  base32Encode,
  base64ToUint8Array,
  base64UrlDecode,
  base64UrlEncode,
  capitalize,
  capitalizeWords,
  compareUint8Arrays,
  decoder,
  encoder,
  hexToUint8Array,
  isZanixHex,
  stringToUint8Array,
  stripComments,
  uint8ArrayToBase64,
  uint8ArrayToHEX,
  uint8ArrayToString,
} from 'jsr:@zanix/utils@[version]/helpers'
```

| Name                 | Signature                                                     | Description                                                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `encoder`            | `TextEncoder`                                                 | Shared `TextEncoder` instance used across the library to turn strings into UTF-8 bytes.                                                                                                                       |
| `decoder`            | `TextDecoder`                                                 | Shared `TextDecoder` instance used across the library to turn UTF-8 bytes back into strings.                                                                                                                  |
| `capitalize`         | `(value: string) => string`                                   | Capitalizes only the first character of a string, leaving the rest untouched. Returns the empty string unchanged.                                                                                             |
| `capitalizeWords`    | `(str: string) => string`                                     | Splits a string on spaces and capitalizes the first character of every word.                                                                                                                                  |
| `stripComments`      | `(value: string) => string`                                   | Strips `//` line comments and `/* ... */` block comments from a JSONC-like string, without touching comment-like text that lives inside quoted values.                                                        |
| `stringToUint8Array` | `(value: string) => Uint8Array<ArrayBuffer>`                  | Encodes a string into a `Uint8Array` using UTF-8 (via `encoder`).                                                                                                                                             |
| `uint8ArrayToString` | `(value: Uint8Array, encode?: string) => string`              | Decodes a `Uint8Array`/`ArrayBuffer` into a string. `encode` defaults to `'utf-8'` and accepts any label supported by `TextDecoder`.                                                                          |
| `uint8ArrayToBase64` | `(uint8Array: Uint8Array) => string`                          | Converts a `Uint8Array` into a standard (non URL-safe) Base64 string.                                                                                                                                         |
| `base64ToUint8Array` | `(base64: string) => Uint8Array<ArrayBuffer>`                 | Decodes a standard Base64 string back into a `Uint8Array`.                                                                                                                                                    |
| `uint8ArrayToHEX`    | `(uint8Array: Uint8Array) => string`                          | Converts a `Uint8Array` into a lowercase hexadecimal string, zero-padded per byte.                                                                                                                            |
| `hexToUint8Array`    | `(hex: string) => Uint8Array`                                 | Converts a hexadecimal string into a `Uint8Array`. Strips internal whitespace and lower-cases the input first. Throws `Error('Hex string must have an even length')` if the cleaned string has an odd length. |
| `base64UrlEncode`    | `(input: string \| Uint8Array) => string`                     | Encodes a string or `Uint8Array` into Base64 and makes it URL-safe by replacing `+` with `-`, `/` with `_`, and stripping trailing `=` padding. Useful for JWTs and URL-embedded tokens.                      |
| `base64UrlDecode`    | `(input: string, toString?: boolean) => Uint8Array \| string` | Decodes a Base64 URL-safe string. Returns a `Uint8Array` by default; pass `toString: true` to get a decoded UTF-8 string instead.                                                                             |
| `base32Encode`       | `(bytes: Uint8Array) => string`                               | Encodes a `Uint8Array` into Base32 (RFC 4648), using the uppercase `A-Z2-7` alphabet with no padding — the conventional format for secrets shown to/typed into authenticator apps (TOTP).                     |
| `base32Decode`       | `(input: string) => Uint8Array`                               | Decodes a Base32 string (RFC 4648) into a `Uint8Array`. Tolerant of lowercase input and optional `=` padding. Throws if a character outside the Base32 alphabet is found.                                     |
| `isZanixHex`         | `(str: string) => boolean`                                    | Checks whether a string matches the internal Zanix hex format `Zx` followed by one or more hex digits (`/^Zx[0-9a-fA-F]+$/`).                                                                                 |
| `compareUint8Arrays` | `(a: Uint8Array, b: Uint8Array) => boolean`                   | Compares two `Uint8Array`s for equality, byte by byte. Returns `false` immediately if their lengths differ.                                                                                                   |

### Base64 URL-safe encoding

```ts
const encoded = base64UrlEncode('Hello, World!')
console.log(encoded) // 'SGVsbG8sIFdvcmxkIQ' (no '+', '/' or '=' padding)

const decodedBytes = base64UrlDecode(encoded)
console.log(decodedBytes) // Uint8Array with the bytes of "Hello, World!"

const decodedString = base64UrlDecode(encoded, true)
console.log(decodedString) // 'Hello, World!'
```

### Base32 encoding

```ts
const encoded = base32Encode(stringToUint8Array('hello'))
console.log(encoded) // 'NBSWY3DP' (unpadded)

const decoded = base32Decode(encoded)
console.log(uint8ArrayToString(decoded)) // 'hello'

// Tolerant of lowercase input and optional '=' padding
base32Decode('nbswy3dp') // same bytes as above
base32Decode('MZXW6YQ=') // padded input also decodes correctly
```

### String / Uint8Array conversion

```ts
const bytes = stringToUint8Array('hello') // Uint8Array<ArrayBuffer>
const text = uint8ArrayToString(bytes) // 'hello'
```

### Hex conversion

```ts
const bytes = hexToUint8Array('48 65') // Uint8Array [0x48, 0x65] — spaces are ignored
const hex = uint8ArrayToHEX(bytes) // '4865'

hexToUint8Array('abc') // throws: Hex string must have an even length
```

### Stripping comments

`stripComments` removes real `//` and `/* ... */` comments but preserves
`//`-looking content that appears inside a quoted string value:

```ts
stripComments('/* block comment */{"a": 1}') // '{"a": 1}'
stripComments('  // full line comment\n{"a": 1}') // '\n{"a": 1}'
stripComments('{"a": 1} // trailing comment') // '{"a": 1}'
stripComments('{"note": "//not a comment"}') // '{"note": "//not a comment"}' (unchanged)
```

Use it with trusted input only — it is meant for JSONC-style config files, not
for sanitizing untrusted code.

### Capitalization

```ts
capitalize('hello') // 'Hello'
capitalizeWords('the quick brown fox') // 'The Quick Brown Fox'
```

## Constants

Import the frozen default export, named exports, or both from the `/constants`
subpath:

```ts
import zanixConstants, { CONFIG_FILE } from 'jsr:@zanix/utils@[version]/constants'
```

`zanixConstants` is a `Readonly` object exposing the same values as the named
exports below.

| Name                | Value                              | Description                                                                                                                                                                 |
| ------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONFIG_FILE`       | `'deno.json'`                      | Name of the configuration file used for the Deno project.                                                                                                                   |
| `DISTRIBUTION_FILE` | `'app.mjs'`                        | Default distribution file name used for compilations.                                                                                                                       |
| `MAIN_MODULE`       | `'mod.ts'`                         | Default main module file name.                                                                                                                                              |
| `ZNX_FLAGS`         | `['use comet']`                    | Zanix directive-prologue flags — the flag names the linter's `use-znx-flags` rule accepts as a file's first statement. See [Linter plugins](./linter.md#deno-zanix-plugin). |
| `ZANIX_LOGO`        | ASCII-art string of the ZANIX logo | Text representation of the ZANIX logo, wrapped in zero-width space characters, intended for display in console output or logs.                                              |

## Regular expressions

Import the frozen default export, named exports, or both from the `/regex`
subpath:

```ts
import zanixRegex, { emailRegex } from 'jsr:@zanix/utils@[version]/regex'
```

`zanixRegex` is a `Readonly` object exposing the same patterns as the named
exports below.

| Name                  | Purpose                                                                                                                                                                              | Example match                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| `booleanRegex`        | Matches the literal strings `true`/`false`, case-insensitive.                                                                                                                        | `'TRUE'`, `'false'`                         |
| `commentRegex`        | Matches a `//` line comment or `/* ... */` block comment, as long as it isn't immediately preceded/followed by a quote character.                                                    | `'// comment'`, `'/* comment */'`           |
| `emailRegex`          | Validates a basic email address shape (`local@domain.tld`).                                                                                                                          | `'usuario@example.com'`                     |
| `enclosedStringRegex` | Matches any string enclosed by matching single quotes, double quotes, or backticks, including escaped quotes inside.                                                                 | `'"This is a test"'`                        |
| `isoDateRegex`        | Validates an ISO date in `YYYY-MM-DD` format (does not check calendar validity).                                                                                                     | `'2025-03-09'`                              |
| `isoDatetimeRegex`    | Validates an ISO 8601 datetime `YYYY-MM-DDTHH:MM:SS(.mmm)Z`, with optional milliseconds.                                                                                             | `'2025-03-09T21:40:18.443Z'`                |
| `keyValueRegex`       | Matches a `key: "value"` style declaration where the key is a standard identifier and the value is quoted (single, double, or backtick).                                             | `'key: "value"'`                            |
| `localTimeRegex`      | Validates a 12-hour time `H:MM:SS` with an optional trailing `AM`/`PM`.                                                                                                              | `'2:30:15 PM'`                              |
| `numericRegex`        | Validates a numeric string, with an optional decimal part.                                                                                                                           | `'42'`, `'3.14'`                            |
| `phoneRegex`          | Validates an international phone number: optional leading `+`, 2 to 15 digits, first digit non-zero.                                                                                 | `'+1234567890'`                             |
| `securePasswordRegex` | Validates a password of at least 8 characters containing at least one lowercase letter, one uppercase letter, and one digit (special characters `@$!%*?&` allowed but not required). | `'Secure123!'`                              |
| `singleQuoteRegex`    | Matches a string wrapped in double quotes that does not itself contain a single quote.                                                                                               | `'"This is valid"'`                         |
| `urlRegex`            | Validates an `http`/`https` URL with an optional `www.` subdomain and a valid domain + TLD.                                                                                          | `'https://example.com'`, `'www.github.com'` |
| `usernameRegex`       | Validates a username of 3 to 16 characters made of letters, digits, and underscores.                                                                                                 | `'usuario_123'`                             |
| `utcTimeRegex`        | Validates a UTC time `HH:MM:SS.mmmZ` including mandatory milliseconds and trailing `Z`.                                                                                              | `'21:40:18.443Z'`                           |
| `uuidRegex`           | Validates a UUID v4 string (case-insensitive).                                                                                                                                       | `'550e8400-e29b-41d4-a716-446655440000'`    |
| `versionRegex`        | Validates a semantic version `x.y.z`, an optional pre-release suffix, or the literal string `'latest'`.                                                                              | `'2.0.1'`, `'1.0.0-beta.1'`, `'latest'`     |

### Examples

```ts
emailRegex.test('usuario@example.com') // true
emailRegex.test('usuario@com') // false — missing a valid TLD

urlRegex.test('www.github.com') // true
urlRegex.test('notaurl') // false — no domain/TLD

uuidRegex.test('550e8400-e29b-41d4-a716-446655440000') // true
uuidRegex.test('50e400-e29b-41d4-a716-446655440000') // false — wrong length

phoneRegex.test('+1234567890') // true
phoneRegex.test('+1 234 567 890') // false — spaces are not allowed

isoDateRegex.test('2025-03-09') // true
isoDateRegex.test('2025-03-09T21:40:18.443Z') // false — this is a datetime, not a plain date

securePasswordRegex.test('Secure123!') // true
securePasswordRegex.test('weakpass') // false — no uppercase letter and no digit
```

## See also

- [Helpers](./helpers.md)
- [Validator](./validator.md)
- [Linter plugins](./linter.md#deno-zanix-plugin) — `use-znx-flags` validates
  `ZNX_FLAGS` usage.
