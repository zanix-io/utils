# Helpers

The `helpers` module groups together the everyday utilities used by the Zanix ecosystem and by any Deno project that wants a bit of scaffolding for free: reading and writing the `deno.json(c)` config, resolving project paths, generating GitHub hooks/workflows, editor configuration, the `Znx` global namespace, the recommended Zanix folder tree, date/URL helpers, and the esbuild-based compiler.

Import everything from the `helpers` entrypoint:

```typescript
import { getRootDir, prepareGithub, readConfig } from 'jsr:@zanix/utils@[version]/helpers'
```

## Config & Paths

Helpers to locate the project root, resolve paths relative to the current module, read/write the `deno.json(c)` configuration, and check for the existence of files and folders.

| Symbol               | Signature                                                                                       | Description                                                                                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getRootDir`         | `(): string`                                                                                    | Returns `Deno.cwd()`, the root directory of the running process.                                                                                                                                          |
| `getConfigDir`       | `(root?: string): string \| null`                                                               | Resolves the path to `deno.json` or `deno.jsonc` inside `root` (defaults to `getRootDir()`). Prefers `deno.json` over `deno.jsonc` when both exist. Returns `null` if neither exists.                     |
| `readConfig`         | `(configPath?: string \| null): ConfigFile`                                                     | Reads and parses (comment-stripped) the `deno` config file. The parsed result is cached in memory; subsequent calls with the same `configPath` reuse the cache. Throws if no config file can be resolved. |
| `saveConfig`         | `(config: ConfigFile, path?: string \| null): Promise<void>`                                    | Serializes `config` with two-space indentation and writes it to `path` (or the resolved config dir, or `deno.jsonc` as a last resort). Resets the internal `readConfig` cache.                            |
| `readModuleConfig`   | `(metaUrl: string, isJsonc?: boolean): Promise<ConfigFile>`                                     | Reads a library's own `deno.json(c)`, either from the local filesystem (when `metaUrl` is a `file:` URL) or by fetching it from the equivalent JSR URL. `isJsonc` defaults to `true`.                     |
| `getSrcDir`          | `(): string`                                                                                    | Returns the `src` folder path from `getZanixPaths()`, assuming a Zanix project layout.                                                                                                                    |
| `getSrcName`         | `(): string`                                                                                    | Returns the `src` folder name (`"src"`) from `getZanixPaths()`.                                                                                                                                           |
| `getFolderName`      | `(uri: string): string`                                                                         | Extracts the base name (last path segment) from a URI or path.                                                                                                                                            |
| `getRelativePath`    | `(to: string, from?: string): string`                                                           | Returns the relative path from `from` (defaults to `getRootDir()`) to `to`.                                                                                                                               |
| `getPathFromCurrent` | `(callerUrl: string, relativePath: string): string`                                             | Resolves `relativePath` against the directory of `callerUrl` (typically `import.meta.url`). Converts `file:` URLs to a plain filesystem path.                                                             |
| `getTemporaryFolder` | `(callerUrl: string): string`                                                                   | Creates (if needed) and returns a `__tmp__` folder next to `callerUrl`, intended to be git-ignored scratch space.                                                                                         |
| `fileExists`         | `(path: string): boolean`                                                                       | Checks whether `path` points to an existing file. Requires `allow-read`.                                                                                                                                  |
| `folderExists`       | `(path: string): boolean`                                                                       | Checks whether `path` points to an existing directory. Requires `allow-read`.                                                                                                                             |
| `collectFiles`       | `(root: string, extensions: string[], callback: (path: string, content: string) => void): void` | Recursively walks `root`, and for every file whose name ends with one of `extensions` calls `callback` with its full path and text content.                                                               |

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
import { getSrcDir, getSrcName } from 'jsr:@zanix/utils@[version]/helpers'

getSrcDir() // e.g. "/project/src"
getSrcName() // "src"
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
```

## Editor

| Symbol               | Signature                                               | Description                                                                                                                                                  |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `createVSCodeConfig` | `(options?: BaseEditorHelperOptions): Promise<boolean>` | Generates a VSCode `settings.json` for the project, pointing it at the resolved `deno.json`/`deno.jsonc` file name. `baseRoot` defaults to the project root. |

```typescript
import { createVSCodeConfig } from 'jsr:@zanix/utils@[version]/helpers'

await createVSCodeConfig()
```

## Zanix namespace & tree

Helpers around the global `Znx` namespace (used internally by the Zanix framework to share config/logger state process-wide) and the recommended folder structure for Zanix projects.

| Symbol                     | Signature                                                                          | Description                                                                                                                                                                                                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Zanix` (type)             | `ZanixGlobal['Znx']`                                                               | The shape of the global `Znx` namespace (`{ config, logger }`).                                                                                                                                                                                                                                     |
| `canUseZnx`                | `(): boolean`                                                                      | Returns whether the global `Znx` object is currently defined.                                                                                                                                                                                                                                       |
| `getGlobalZnx`             | `(): Zanix \| undefined`                                                           | Returns the global `Znx` object, or `undefined` if it hasn't been initialized via `setGlobalZnx`.                                                                                                                                                                                                   |
| `setGlobalZnx`             | `(data: Partial<Zanix>): void`                                                     | Initializes `Znx` on `globalThis` on first call (seeding `config` from the project's `deno.json` `zanix` field, ignoring read errors), then merges `data` into it on every call.                                                                                                                    |
| `getZanixPaths`            | `<T extends ZanixProjectsFull>(type?: T, projectDir?: string): ZanixFolderTree<T>` | Returns the recommended nested folder structure for a Zanix project. `type` is one of `'server'`, `'app'`, `'library'`, `'app-server'`, `'all'`, or `undefined` for the common structure shared by all project types. `projectDir` defaults to `getRootDir()`. Requires `allow-read`. Experimental. |
| `getAllZanixLibrariesInfo` | `(): Promise<ZanixLibraries>`                                                      | Fetches the latest published JSR version of every `@zanix/*` library (`app`, `auth`, `asyncmq`, `core`, `datamaster`, `server`, `worker`, `utils`, `notifications`) and returns them keyed by package name. Result is cached after the first call. Intended for CLI/development use.                |
| `getLatestRelease`         | `(lib: string, username?: string): Promise<string>`                                | Fetches the latest GitHub release tag (e.g. `"2.1.0"`) for `username/lib` via the Shields.io badge endpoint. `username` defaults to `'zanix-io'`. Falls back to `'latest'` on failure.                                                                                                              |
| `getLatestVersion`         | `(lib: string, username?: string): Promise<string>`                                | Fetches the latest JSR version for `@username/lib` via the Shields.io badge endpoint. `username` defaults to `'@zanix'`. Falls back to `'latest'` on failure.                                                                                                                                       |

```typescript
import { canUseZnx, getGlobalZnx, setGlobalZnx } from 'jsr:@zanix/utils@[version]/helpers'

canUseZnx() // false, before any initialization

setGlobalZnx({ config: {} })

canUseZnx() // true
getGlobalZnx() // { config: {}, logger: {} }
```

```typescript
import { getZanixPaths } from 'jsr:@zanix/utils@[version]/helpers'

const common = getZanixPaths() // shared structure: docs, src/@tests, src/typings, src/utils, ...
const serverTree = getZanixPaths('server') // adds src/shared and src/server subtrees
const fullTree = getZanixPaths('all', '/path/to/project') // every subtree, rooted at a custom project dir

common.subfolders.src.FOLDER // e.g. "/path/to/project/src"
```

```typescript
import { getAllZanixLibrariesInfo, getLatestVersion } from 'jsr:@zanix/utils@[version]/helpers'

const version = await getLatestVersion('utils') // e.g. "2.2.14"
const libraries = await getAllZanixLibrariesInfo()
// { '@zanix/utils': { version: '2.2.14' }, '@zanix/server': { version: '1.0.3' }, ... }
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

- [GitHub automation](./github.md)
- [Build](./build.md)
- [Network & IP utilities](./network.md)
- [Types reference](./types.md)
- [Utils](./utils.md)
- [Encryption & Masking](./encryption-masking.md)
