# Helpers

The `helpers` module groups together the everyday utilities used by the Zanix ecosystem and by any Deno project that wants a bit of scaffolding for free: reading and writing the `deno.json(c)` config, resolving project paths, the `Znx` global namespace, date/URL helpers, concurrency primitives, and template interpolation.

Import everything from the `helpers` entrypoint:

```typescript
import { getRootDir, getTemporaryFolder, readConfig } from 'jsr:@zanix/utils@[version]/helpers'
```

## Config & Paths

Helpers to locate the project root, resolve paths relative to the current module, read/write the `deno.json(c)` configuration, and check for the existence of files and folders.

| Symbol               | Signature                                                                                                   | Description                                                                                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getRootDir`         | `(): string`                                                                                                | Returns `Deno.cwd()`, the root directory of the running process.                                                                                                                                          |
| `getConfigDir`       | `(root?: string): string \| null`                                                                           | Resolves the path to `deno.json` or `deno.jsonc` inside `root` (defaults to `getRootDir()`). Prefers `deno.json` over `deno.jsonc` when both exist. Returns `null` if neither exists.                     |
| `readConfig`         | `(configPath?: string \| null): ConfigFile`                                                                 | Reads and parses (comment-stripped) the `deno` config file. The parsed result is cached in memory; subsequent calls with the same `configPath` reuse the cache. Throws if no config file can be resolved. |
| `saveConfig`         | `(config: ConfigFile, path?: string \| null): Promise<void>`                                                | Serializes `config` with two-space indentation and writes it to `path` (or the resolved config dir, or `deno.jsonc` as a last resort). Resets the internal `readConfig` cache.                            |
| `readModuleConfig`   | `(metaUrl: string, isJsonc?: boolean): Promise<ConfigFile>`                                                 | Reads a library's own `deno.json(c)`, either from the local filesystem (when `metaUrl` is a `file:` URL) or by fetching it from the equivalent JSR URL. `isJsonc` defaults to `true`.                     |
| `getFolderName`      | `(uri: string): string`                                                                                     | Extracts the base name (last path segment) from a URI or path.                                                                                                                                            |
| `getRelativePath`    | `(to: string, from?: string): string`                                                                       | Returns the relative path from `from` (defaults to `getRootDir()`) to `to`.                                                                                                                               |
| `getPathFromCurrent` | `(callerUrl: string, relativePath: string): string`                                                         | Resolves `relativePath` against the directory of `callerUrl` (typically `import.meta.url`). Converts `file:` URLs to a plain filesystem path.                                                             |
| `getTemporaryFolder` | `(callerUrl: string): string`                                                                               | Creates (if needed) and returns a `__tmp__` folder next to `callerUrl`, intended to be git-ignored scratch space.                                                                                         |
| `fileExists`         | `(path: string): boolean`                                                                                   | Checks whether `path` points to an existing file. Requires `allow-read`.                                                                                                                                  |
| `folderExists`       | `(path: string): boolean`                                                                                   | Checks whether `path` points to an existing directory. Requires `allow-read`.                                                                                                                             |
| `collectFiles`       | `(root: string \| string[], extensions: string[], callback: (path: string, content: string) => void): void` | Recursively walks `root` (or each root in the array), and for every file whose name ends with one of `extensions` calls `callback` with its full path and text content.                                   |

```typescript
import {
  getConfigDir,
  getRootDir,
  readConfig,
  saveConfig,
} from 'jsr:@zanix/utils@[version]/helpers'

const root = getRootDir()
const configDir = getConfigDir(root) // e.g. "/project/deno.json", or null if not found

const config = readConfig(configDir)
config.version = '1.2.3'

await saveConfig(config, configDir)
```

```typescript
import { getPathFromCurrent, getTemporaryFolder } from 'jsr:@zanix/utils@[version]/helpers'

// Resolve a file relative to the current module
const fixturePath = getPathFromCurrent(import.meta.url, 'fixtures/data.json')

// Get (and create) a git-ignored scratch folder next to the current module
const tmpDir = getTemporaryFolder(import.meta.url)
```

```typescript
import { collectFiles, fileExists, folderExists } from 'jsr:@zanix/utils@[version]/helpers'

fileExists('./deno.json') // true | false
folderExists('./src') // true | false

collectFiles('./src', ['.gql', '.graphql'], (path, content) => {
  console.log(`Found ${path} (${content.length} chars)`)
})

// A single root or an array of roots are both accepted
collectFiles(['./src', './shared'], ['.gql', '.graphql'], (path, content) => {
  console.log(`Found ${path} (${content.length} chars)`)
})
```

## Zanix namespace

Helpers around the global `Znx` namespace, used internally by the Zanix framework to share
config/logger state process-wide.

> **Moved**: the project-tree scaffolding that used to live here (`getZanixPaths`,
> `getAllZanixLibrariesInfo`, `getLatestVersion`/`getLatestRelease`, `ZanixTree`) and the GitHub/
> editor bootstrapping helpers (`prepareGithub`, `createVSCodeConfig`, and their supporting
> functions) were moved to `@zanix/cli` — every real consumer of that code was `cli` itself, never a
> transversal utility anyone else depended on. See `@zanix/cli`'s own `ENGINEERING.md` §5/§7 for the
> full reasoning. The `Zanix*SrcTree`/`ZanixFolderTree`/`ZanixLibraries`/etc. **types** describing
> that folder-tree shape are still exported from `@zanix/utils/types` (see
> [Types reference](./types.md)) — only the runtime implementation moved.

| Symbol         | Signature                      | Description                                                                                                                                                                      |
| -------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Zanix` (type) | `ZanixGlobal['Znx']`           | The shape of the global `Znx` namespace (`{ config, logger }`).                                                                                                                  |
| `canUseZnx`    | `(): boolean`                  | Returns whether the global `Znx` object is currently defined.                                                                                                                    |
| `getGlobalZnx` | `(): Zanix \| undefined`       | Returns the global `Znx` object, or `undefined` if it hasn't been initialized via `setGlobalZnx`.                                                                                |
| `setGlobalZnx` | `(data: Partial<Zanix>): void` | Initializes `Znx` on `globalThis` on first call (seeding `config` from the project's `deno.json` `zanix` field, ignoring read errors), then merges `data` into it on every call. |

```typescript
import { canUseZnx, getGlobalZnx, setGlobalZnx } from 'jsr:@zanix/utils@[version]/helpers'

canUseZnx() // false, before any initialization

setGlobalZnx({ config: {} })

canUseZnx() // true
getGlobalZnx() // { config: {}, logger: {} }
```

## Dates & URLs

| Symbol                           | Signature                                                             | Description                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getISODate`                     | `(): string`                                                          | Returns the current local date as `YYYY-MM-DD`.                                                                                                                                                                                                                                                                                                   |
| `getLocalTime`                   | `(): string`                                                          | Returns `new Date().toLocaleTimeString()`.                                                                                                                                                                                                                                                                                                        |
| `getUtcTime`                     | `(): string`                                                          | Returns the UTC time portion (`HH:mm:ss.sssZ`) of the current ISO timestamp.                                                                                                                                                                                                                                                                      |
| `parseTTL`                       | `(input: number \| string): number`                                   | Parses a human-readable duration (`"1h"`, `"30m"`, `"7d"`, `"2w"`, `"1mo"`, `"1y"`, etc.) into seconds. A numeric input is returned as-is (assumed to already be seconds). Throws on an unrecognized string format.                                                                                                                               |
| `verifyUrl`                      | `(url: string): URL \| undefined`                                     | Attempts to parse `url` as a `URL`, returning `undefined` instead of throwing when it is invalid.                                                                                                                                                                                                                                                 |
| `isFileUrl`                      | `(url: string): boolean`                                              | Returns whether `url` parses to the `file:` protocol.                                                                                                                                                                                                                                                                                             |
| `getProcessedParams`             | `(searchParams: URLSearchParams): object`                             | Converts `URLSearchParams` into a plain object: simple keys map to a single value, repeated keys map to an array, and bracket-style keys (`keyA[subKeyA]=a`) map to nested objects.                                                                                                                                                               |
| `toSearchParams`                 | `(params: Record<string, unknown>): URLSearchParams`                  | Builds a `URLSearchParams` from a plain object — the reverse of `getProcessedParams`, using the same conventions so the two round-trip. Arrays become duplicate keys, nested objects use bracket notation, `null`/`undefined` values are skipped.                                                                                                 |
| `searchParamsPropertyDescriptor` | `(searchParams: URLSearchParams): PropertyDescriptor & ThisType<any>` | Builds a lazily-computed `get`/`set` property descriptor backed by `getProcessedParams`, for use with `Object.defineProperty` on a class or object that wraps `URLSearchParams`.                                                                                                                                                                  |
| `interpolateUrl`                 | `(url: string, record: Record<string, unknown>): string`              | Interpolates `{{field}}`/`{{nested.path}}` placeholders in a URL template (see [Templates & interpolation](#templates--interpolation)). The path portion is interpolated as plain text; each query segment whose value is exactly one placeholder is expanded via `toSearchParams` (arrays/nested objects included) instead of being stringified. |

```typescript
import { getISODate, getLocalTime, getUtcTime } from 'jsr:@zanix/utils@[version]/helpers'

getISODate() // "2026-07-23"
getLocalTime() // e.g. "2:15:03 PM"
getUtcTime() // e.g. "18:15:03.512Z"
```

```typescript
import { parseTTL } from 'jsr:@zanix/utils@[version]/helpers'

parseTTL('1h') // 3600
parseTTL('15m') // 900
parseTTL(300) // 300

const expiresIn = parseTTL('7d')
jwt.sign(payload, secret, { expiresIn })
```

```typescript
import { isFileUrl, verifyUrl } from 'jsr:@zanix/utils@[version]/helpers'

verifyUrl('https://example.com') // URL instance
verifyUrl('not a url') // undefined

isFileUrl(import.meta.url) // true when running a local module
```

```typescript
import { getProcessedParams, toSearchParams } from 'jsr:@zanix/utils@[version]/helpers'

getProcessedParams(new URLSearchParams('?keyA=a&keyB=b')) // { keyA: 'a', keyB: 'b' }
getProcessedParams(new URLSearchParams('?keyA=a&keyA=b')) // { keyA: ['a', 'b'] }
getProcessedParams(new URLSearchParams('keyA[subKeyA]=a&keyA[subKeyB]=b'))
// { keyA: { subKeyA: 'a', subKeyB: 'b' } }

// toSearchParams is the reverse direction, using the same conventions
toSearchParams({ keyA: 'a', keyB: ['x', 'y'] }).toString() // 'keyA=a&keyB=x&keyB=y'
toSearchParams({ keyA: { subKeyA: 'a' } }).toString() // 'keyA%5BsubKeyA%5D=a'
```

```typescript
import { interpolateUrl } from 'jsr:@zanix/utils@[version]/helpers'

interpolateUrl('https://x.com/{{id}}?tags={{tags}}', { id: '42', tags: ['a', 'b'] })
// 'https://x.com/42?tags=a&tags=b'

interpolateUrl('https://x.com?address={{address}}', {
  address: { city: 'Bogotá', zip: '110111' },
})
// 'https://x.com?address%5Bcity%5D=Bogot%C3%A1&address%5Bzip%5D=110111'
```

## Templates & interpolation

Generic `{{field}}`/`{{nested.path}}` placeholder resolution, used internally by `interpolateUrl`
(see [Dates & URLs](#dates--urls)) but reusable for interpolating any string/object/array against
a record.

| Symbol                  | Signature                                           | Description                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `getPath`               | `(record: any, path: string): unknown`              | Resolves a dot-separated path (array indices included, e.g. `'items.0.name'`) against `record`.                                                                                                                                                                                                                                                                                                              |
| `matchWholePlaceholder` | `(value: string): string \| null`                   | Returns the field path if `value` is exactly one `{{field}}` placeholder (nothing before or after it), or `null` otherwise (mixed text, multiple placeholders, or none).                                                                                                                                                                                                                                     |
| `interpolate`           | `<T>(value: T, record: Record<string, unknown>): T` | Resolves `{{field}}`/`{{nested.path}}` placeholders in `value` against `record`. A string that is _exactly_ one placeholder resolves to the field's real value (any type); a string mixing a placeholder with other text always substitutes as a string. Arrays/objects are walked recursively; any other value is returned as-is. Skips `${{...}}` (leading `$`), leaving that syntax for `interpolateEnv`. |
| `interpolateEnv`        | `<T>(value: T): T`                                  | Resolves `${{ENV_VAR}}` placeholders in `value` against `Deno.env`, a separate convention from `interpolate`'s `{{field}}` so both can appear in the same string without either resolving the other's placeholders. An unset variable is substituted as the literal text `'undefined'` rather than throwing. Arrays/objects are walked recursively; any other value is returned as-is.                       |

```typescript
import { interpolate } from 'jsr:@zanix/utils@[version]/helpers'

interpolate('Bearer {{token}}', { token: 'abc123' }) // 'Bearer abc123'
interpolate('{{amount}}', { amount: 42 }) // 42 (real type preserved, not stringified)
interpolate({ id: '{{user.id}}' }, { user: { id: 7 } }) // { id: 7 }
interpolate('Bearer ${{TOKEN}}', {}) // 'Bearer ${{TOKEN}}' (left untouched)
```

```typescript
import { interpolateEnv } from 'jsr:@zanix/utils@[version]/helpers'

Deno.env.set('API_KEY', 'my-secret-key')
interpolateEnv('Bearer ${{API_KEY}}') // 'Bearer my-secret-key'
interpolateEnv('Bearer ${{MISSING}}') // 'Bearer undefined' (unset variable)
interpolateEnv({ headers: { authorization: 'Bearer ${{API_KEY}}' } })
// { headers: { authorization: 'Bearer my-secret-key' } }
```

## Routes

| Symbol       | Signature                                    | Description                                                                                                                                                                       |
| ------------ | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cleanRoute` | `(route: string, keepCase?: string): string` | Normalizes a route path: trims whitespace, converts backslashes to slashes, collapses repeated slashes, ensures a single leading `/`, strips a trailing slash, and lowercases it. |

```typescript
import { cleanRoute } from 'jsr:@zanix/utils@[version]/helpers'

cleanRoute('///folder1/folder2//file') // '/folder1/folder2/file'
cleanRoute('  \\API\\Users\\  ') // '/api/users'
cleanRoute('  \\API\\Users\\  ', true) // '/API/Users'
cleanRoute('') // '/'
```

## URL params

| Symbol             | Signature                        | Description                                                                                                                                                                                                                                                                  |
| ------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `processUrlParams` | `<T extends unknown>(obj: T): T` | Recursively `decodeURIComponent`s every string value inside an object or array, in place. Non-string values are untouched. If decoding throws partway through (a malformed `%` sequence), the error is swallowed and the object is returned as-is, decoded up to that point. |

```typescript
import { processUrlParams } from 'jsr:@zanix/utils@[version]/helpers'

processUrlParams({ user: 'John%20Doe', tags: ['NodeJS%20Dev'] })
// { user: 'John Doe', tags: ['NodeJS Dev'] }
```

## Concurrency

| Symbol        | Signature                                                                                                                    | Description                                                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Semaphore`   | `class Semaphore { constructor(permits: number); acquire(): Promise<void>; release(): boolean; permits: number }`            | Limits concurrent access to a resource to a fixed number of permits; tasks beyond that limit queue until one is released.                                                |
| `LockManager` | `class LockManager { constructor(permitsPerKey?: number); withLock<T>(key: string, fn: () => T \| Promise<T>): Promise<T> }` | Manages one `Semaphore` per key (default 1 permit, i.e. an exclusive lock), so calls for the same key never run concurrently while different keys still run in parallel. |

```typescript
import { LockManager, Semaphore } from 'jsr:@zanix/utils@[version]/helpers'

const semaphore = new Semaphore(2) // allow 2 concurrent tasks
await semaphore.acquire()
try {
  // ...work...
} finally {
  semaphore.release()
}

const lockManager = new LockManager() // exclusive lock per key
await lockManager.withLock(`user:${userId}`, async () => {
  // only one update runs at a time for this userId
  await saveToDatabase(data)
})
```

## Cron

| Symbol         | Signature                                                         | Description                                                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nextCronDate` | `(cronExpr: string, fromDate?: Date): Promise<Date \| undefined>` | Computes the next execution `Date` after `fromDate` (default: now) matching a 6-field cron expression (`second minute hour day month weekday`). Returns `undefined` if the expression is invalid. |

```typescript
import { nextCronDate } from 'jsr:@zanix/utils@[version]/helpers'

await nextCronDate('0 */15 * * * *') // next run at the next quarter-hour mark
await nextCronDate('not a cron expr') // undefined
```

## Code-to-storage sync

| Symbol         | Signature                                                                                                                                | Description                                                                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `planCodeSync` | `<V, Id>(staticEntries: StaticSyncEntry<V>[], existing: PersistedSyncEntry<V, Id>[], equals?: (a: V, b: V) => boolean): SyncPlan<V, Id>` | Reconciles code-defined entries against their persisted counterparts, without ever overwriting a manual edit. Pure — no I/O; the caller decides what to actually do with the returned plan. |

For each persisted entry, `planCodeSync` decides one of three outcomes: report it as `toOrphan`
(its `key` no longer has a matching code-defined entry — the caller decides what that means:
delete, mark as no longer code-owned, or leave it as-is), report it as `toResync` (the code value
changed and the persisted value was never edited directly since the last sync), or leave it alone
(a manual edit, or an entry with no sync history at all, always wins over a later code change).
Every code-defined entry with no persisted record yet is reported as `toSeed`.

```typescript
import { planCodeSync } from 'jsr:@zanix/utils@[version]/helpers'
import type { PersistedSyncEntry, StaticSyncEntry } from 'jsr:@zanix/utils@[version]/helpers'

const staticEntries: StaticSyncEntry<string>[] = [
  { key: 'welcome', value: 'Hello {{name}}' },
  { key: 'farewell', value: 'Bye {{name}}' },
]

const existing: PersistedSyncEntry<string>[] = [
  { _id: 'a1', key: 'welcome', value: 'Hello {{name}}', lastSyncedValue: 'Hi {{name}}' },
  { _id: 'a2', key: 'removed', value: 'Old copy' },
]

const plan = planCodeSync(staticEntries, existing)
// plan.toOrphan === [{ _id: 'a2' }]              -- 'removed' has no matching code entry
// plan.toResync === []                            -- 'welcome' was edited manually, left alone
// plan.toSeed   === [{ key: 'farewell', value: 'Bye {{name}}' }]
```

## Misc

| Symbol         | Signature                | Description                                                                                                       |
| -------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `generateUUID` | `(): string`             | Returns a random v4 UUID via `crypto.randomUUID()`.                                                               |
| `isFileUrl`    | `(url: string): boolean` | See [Dates & URLs](#dates--urls). Listed here as well since it is a general-purpose URL check, not date-specific. |

```typescript
import { generateUUID } from 'jsr:@zanix/utils@[version]/helpers'

generateUUID() // e.g. "3fa1c2b0-9c1e-4e2a-8f3e-6f6a6a6c8b21"
```

## Testing utilities

`mockWrap` actually lives in `modules/testing/mod.ts`, not in the `helpers` group, but it is the only public symbol exported from that module, so it is documented here rather than in its own file.

| Symbol     | Signature                                                                       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mockWrap` | `<F extends Function>(fn: F, context: Record<string, any>, force?: boolean): F` | Rewrites the source of `fn` so that every identifier matching a key in `context` is rebound to `this.<key>`, then returns a new function bound to `context`. This lets a test substitute the global/imported dependencies a function calls (other functions, constants, modules) with mocks, without touching or re-exporting internals from the original file. When a `context` value is a function and `force` is not set, only call sites (`key(`) are rewritten, preserving plain references to the identifier; pass `force: true` to rewrite every occurrence unconditionally. |

```typescript
import { mockWrap } from 'jsr:@zanix/utils@[version]/testing'

function myFunction() {
  return user()
}

const mock = mockWrap(myFunction, { user: () => 'testUser' })
mock() // 'testUser'
```

```typescript
import { getConfigDir } from 'jsr:@zanix/utils@[version]/helpers'
import { mockWrap } from 'jsr:@zanix/utils@[version]/testing'
import { join } from '@std/path/join'

// Replace getRootDir, join, fileExists and CONFIG_FILE with test doubles,
// without changing how paths.ts itself is written.
const context = {
  getRootDir: () => '/mock/root/dir/',
  join,
  fileExists: (filePath: string) => filePath === '/mock/root/dir/config.json',
  CONFIG_FILE: 'config.json',
}

const mockedGetConfigDir = mockWrap(getConfigDir, context)
mockedGetConfigDir() // "/mock/root/dir/config.json"
```

## See also

- [Network & IP utilities](./network.md)
- [Types reference](./types.md)
- [Utils](./utils.md)
- [Encryption & Masking](./encryption-masking.md)
