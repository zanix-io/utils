# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to
[Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [4.1.1] - 2026-09-01

### Fixed

- **`generateHash`/`validateHash`'s hash-stretching loop chained up to 10000 individually-awaited
  `crypto.subtle.digest()` calls, one event-loop yield per iteration** (`helpers`) — under
  main-thread contention, each yield is a chance for the loop's continuation to queue behind
  unrelated pending work, so total latency scaled with iteration count rather than actual CPU
  cost; a single `validateHash` call could degrade from ~100ms to several minutes while other
  concurrent requests stayed fast. The chain now runs synchronously in batches of 500 via
  `node:crypto`'s `createHash` (byte-for-byte identical output to `crypto.subtle.digest` for
  SHA-1/256/384/512), yielding to the event loop once per batch instead of once per digest.
  Existing hashes remain valid — verified byte-for-byte compatible with the previous
  implementation across every encryption level.

## [4.1.0] - 2026-08-28

### Added

- **`'server-only'` — a new `ZNX_FLAGS` directive-prologue flag** (`utils`) — marks a file as one
  that must never reach a `@zanix/space` Comet's client bundle; `cometPlugin` (`@zanix/space/vite`)
  fails the build with the offending import chain if a Comet's own module graph ever reaches one.
  `use-znx-flags` (`deno-zanix-plugin`) accepts it as a known flag the same way it already accepts
  `'use comet'`. See `@zanix/space`'s own `server-only-directive.ts` for the full convention.

### Fixed

- **`signRSA`/`verifyRSA` signed and verified with `RSA-PSS`, not the `RSASSA-PKCS1-v1_5` that
  "RS256"/"RS384"/"RS512" actually mean** (`helpers`) — RFC 7518 §3.3 defines those JWA algorithm
  names as plain PKCS#1 v1.5 padding, a different, JWA-distinct scheme from RSA-PSS (identified as
  "PS256"/etc, RFC 7518 §3.5). `@zanix/auth`'s JWT signing (`createJWT`/`createServiceAssertion`)
  labels its header `alg: "RS256"` while the actual signature underneath was RSA-PSS; every
  Deno-to-Deno flow in the ecosystem verified fine because this package's own `verifyRSA` made the
  same substitution on both ends, self-consistently, but any spec-compliant external RS256 verifier
  (PyJWT, `jose`, `jsonwebtoken`, `openssl`) rejects an RSA-PSS signature presented as RS256
  outright. `signRSA`/`verifyRSA` now sign and verify with `RSASSA-PKCS1-v1_5` directly.
  `generateRSAKeys` is unaffected by this change (plain PKCS8/SPKI key export carries no
  algorithm-specific material, so a keypair generated with any `algorithm` value still works with
  `signRSA`/`verifyRSA`); `ValidRSAKeysOptions['algorithm']` gains `'RSASSA-PKCS1-v1_5'` as an
  explicit accepted value alongside the existing `'RSA-OAEP'`/`'RSA-PSS'`.

- **`@zanix/logger/client`'s browser bundle still broke, now on `@std/fmt/colors`/`@std/path`, even
  after 3.1.0's `WorkerManager` fix** (`logger`) — `modules/logger/base.ts` (used by BOTH the
  server `Logger` and `createClientLogger`) had a static, unconditional `import * as colors from
  '@std/fmt/colors'`, and reached `@std/path` transitively through `readConfig`
  (`modules/helpers/config.ts`) from two independent call sites: `base.ts`'s own header-formatting
  logic, and `modules/helpers/zanix/namespace.ts`'s `setGlobalZnx` (called by every `Logger`
  constructor, the browser-safe one included). A Deno-standard-library specifier like these two can
  only ever resolve to a remote `https://jsr.io/...` URL, never a local file — something a browser
  bundler (Vite/esbuild) cannot bundle, regardless of whether the import is actually reached at
  runtime. The existing `isBrowser` branch in `buildHeaderLog` already avoided ANSI-coloring output
  in a browser (fixed in 2.6.1) — that was never the problem; the eager, unconditional IMPORT was.
  Both leaks are fixed the same way `WorkerManager` was in 3.1.0: registration-based indirection
  (`registerColorFormatter`/`registerConfigNameReader` in `base.ts`, `registerConfigReader` in
  `namespace.ts`) wired up as an import-time side effect only by the real server barrels
  (`modules/logger/mod.ts`, `modules/helpers/mod.ts`) — never by `createClientLogger`'s own
  `@zanix/logger/client` entrypoint. Confirmed via `deno info`'s own module graph that neither
  specifier is reachable from `@zanix/logger/client` through a real (runtime) import edge anymore,
  only ever a type-only one a bundler transpiling TypeScript elides before resolving anything.
  Every existing consumer of the server `Logger` (`@zanix/utils/logger`) and of
  `@zanix/utils/helpers` keeps identical real ANSI-colored output and real config-file reading,
  with no code changes required on their part.

- **`readModuleConfig` no longer reports a permission denial as a generic "config file not
  found"** (`helpers`) — its `file:` branch walks up ancestor directories looking for the config
  file, and each candidate is now stat'd directly instead of through `fileExists`, which reports
  every failure (a genuinely missing file and a denied `--allow-read` grant alike) as a plain
  `false`. A `Deno.errors.NotCapable`/`PermissionDenied` now propagates as itself the moment it
  occurs; only a real `Deno.errors.NotFound` lets the walk continue to the parent directory, and
  only reaching the filesystem root with nothing found still raises the generic `NotFound`.
  `fileExists` itself is unchanged — its existing callers all only ever needed a boolean.

## [4.0.0] - 2026-08-25

### Removed

- **BREAKING: the root `.` entrypoint is gone — `@zanix/utils` no longer has a bare import at
  all.** It used to re-export `testing`, `helpers`, `workers`, `errors`, `validator`, and the
  `constants`/`regex` default exports all at once, so a bare `import ... from '@zanix/utils'` for
  just one of them dragged in every other module regardless of need — the same over-broad-barrel
  shape found elsewhere in the ecosystem (`@zanix/app/runtime`,
  `@zanix/asyncmq`'s `mod.ts`). `/logger` already never re-exported from root; every other module
  now follows that same precedent. `mod.ts` itself is deleted, and `"."` is gone from
  `deno.jsonc`'s own `exports` map — every module is reachable only via its own dedicated
  subpath, which already existed for all of them. No deprecation window: a full audit of all 12
  Zanix ecosystem repos (admin, app, asyncmq, auth, cli, console, core, datamaster,
  notifications, server, space, space-ui) confirms zero bare `@zanix/utils` imports anywhere,
  so there is no known consumer to protect with a grace period — and a JSDoc
  `@deprecated` tag on a re-export wouldn't have worked as a real signal anyway (TypeScript
  resolves it against the original declaration, not the re-exporting barrel).

  | Was (root)                                                                                 | Now                      |
  | ------------------------------------------------------------------------------------------ | ------------------------ |
  | testing helpers (`mockWrap`, ...)                                                          | `@zanix/utils/testing`   |
  | helpers (`getConfigDir`, `interpolate`, ttl/sync, encryption/masking, `lazyFunction`/etc.) | `@zanix/utils/helpers`   |
  | workers (`WorkerManager`, ...)                                                             | `@zanix/utils/workers`   |
  | errors (`HttpError`, `serializeError`, ...)                                                | `@zanix/utils/errors`    |
  | validator (`BaseRTO`, `classValidation`, decorators)                                       | `@zanix/utils/validator` |
  | `constants` default export                                                                 | `@zanix/utils/constants` |
  | `regex` default export                                                                     | `@zanix/utils/regex`     |

### Added

- **`lazyFunction`/`lazyClass`/`lazyValue` — lazy resolution for a genuinely conditional/optional
  dependency** (`helpers`) — the runtime half of the ecosystem's lazy-dependency convention. Each
  helper defers `import(specifier)` until the wrapper it returns is actually invoked, never at
  import time: `lazyFunction` resolves and calls a real exported function, `lazyClass` resolves a
  real exported class and returns an async FACTORY (never `new`-able directly until resolved),
  and `lazyValue` resolves a plain exported value/constant via a thunk, relying on Deno's own
  module cache (not a caching layer of its own) to dedupe repeated calls. `specifier` must be a
  fully-qualified `jsr:`/`npm:` string kept OUTSIDE the caller's own `deno.json` `imports` map —
  confirmed empirically, via a real, controlled `deno check`/`node_modules` repro, that under
  `nodeModulesDir: "auto"` a bare alias declared in `imports` alone (regardless of whether
  reachable code ever imports it) is enough to trigger `npm install`-style materialization of
  every npm dependency the aliased package pulls in; passing the specifier straight to these
  helpers instead sidesteps that. Real, `deno run`-subprocess-backed integration coverage confirms
  both halves of the contract against an actual `npm:` package under a real
  `nodeModulesDir: "auto"` project: building a wrapper alone never touches `node_modules`, and
  invoking it does, on demand.

### Fixed

- **`deno-fmt-plugin`'s `line-width` rule missed a real, common false-positive shape** (`linter`) —
  a line whose only real excess is a long descriptive STRING (a `Deno.test('a long name', fn)`
  call, a log message) used to still get reported, because the rule's old string exception
  required the ENTIRE line to go nearly empty once every string was stripped out; boilerplate
  around the string (`Deno.test(`, a trailing comma, `async () => {`) survived that strip and kept
  the line just over the old threshold, even though the string was the sole real cause of the
  overflow. Every string literal's content is now swapped for a short, fixed placeholder BEFORE a
  line's width is measured (not stripped to nothing), so the check now genuinely measures whether
  the surrounding CODE fits the budget on its own. Confirmed real and not just a `Deno.test`
  special case: this is not redundant with `deno fmt`, since the shared pre-commit hook runs
  `deno fmt` immediately before `deno lint` in the same pass — this rule can only ever see a line
  whose length `fmt` itself declines to touch (a string literal, a comment), never one it could
  have safely wrapped instead (already confirmed `fmt` correctly wraps a long call/member-chain on
  its own). A genuinely long line of real CODE, with no string dominating it, still gets reported
  exactly as before.

## [3.1.2] - 2026-08-24

### Fixed

- **`docs/logger.md`'s own `/api/log` relay example destructured a `type` field that
  `createClientLogger`'s fetcher never actually sends** (`logger`) — the fetcher receives a
  `DefaultFormattedLog`-shaped object, whose severity field is `level`, not `type`. A relay
  endpoint following the example as written would always parse `type` as `undefined`.
  `Logger#ingest`'s own parameter happens to be named `type`, but that's just its local name —
  the doc now destructures `level` and passes it positionally.

### Changed

- **`createClientLogger` now defaults to `disableGlobalAssign: true`, overridable via a new
  second `options` parameter** (`logger`) — a browser client instance has no real reason to own
  `globalThis.logger`/`Znx.logger` in its own (browser) realm by default, since every real
  consumer imports it directly. Not a fix for a cross-realm collision risk (a browser tab's
  `globalThis` and a server process's `globalThis` were never the same object to begin with) —
  purely removes an unused global assignment by default. Pass
  `createClientLogger(fetcher, { disableGlobalAssign: false })` to opt back in — e.g. for a
  `window.logger`-style debugging convenience in a dev build — instead of wiring the global
  assignment by hand.
- **`Logger#ingest` gains a new `origin` parameter, defaulting to `'client'`** (`logger`) —
  `ingest(type, origin, ...data)`; `origin` is merged onto the persisted log as a TOP-LEVEL field
  (`DefaultFormattedLog.origin`), sibling to `timestamp`/`level`/etc., not buried inside `data` —
  so a stored/queried log can be filtered or aggregated by origin directly, and can be told apart
  from one this instance logged locally itself. Defaults to `'client'` since `ingest`'s only real
  use is relaying an entry a browser client's own `createClientLogger` instance already logged —
  pass an explicit value for a non-browser origin relaying through the same endpoint (another
  service, a mobile app, ...). Kept entirely separate from `data` internally, specifically so a
  relayed caller's own genuine trailing `'noSave'` sentinel is still correctly detected — `origin`
  can never displace it. This is a signature change to a method introduced only hours earlier in
  this same unreleased cycle, with no real external consumer yet — existing callers (e.g.
  `@zanix/space`'s own `/api/log` handler) are updated in the same change.

## [3.1.1] - 2026-08-24

### Fixed

- **`Logger#ingest` printed a relayed remote log to this process's own console, same as a
  genuine local log** (`logger`) — introduced in `3.1.0`, `ingest` shared its full pipeline with
  `warn`/`error`/etc. via the private `#log`, including `showMessage`'s console print. A log
  relayed from a browser client (via `@zanix/utils/logger/client`'s `createClientLogger`, through
  an app's own HTTP endpoint) already surfaced through its own console/UI on the client side;
  printing it again on the server misrepresented a remote event as a local one, and could flood
  the server's own console under real client traffic. `ingest` still redacts and persists exactly
  as before (never `noSave`) — it just no longer calls `showMessage`.

## [3.1.0] - 2026-08-24

### Fixed

- **Importing `@zanix/logger` in a browser client bundle unconditionally pulled in
  `WorkerManager`/`Deno.readTextFile`, breaking the build** (`logger`) — `Logger`'s default
  file-based storage lived in the same module `Logger` itself was defined in, so a bundler's
  module graph reached `WorkerManager` the moment anything imported `Logger` at all, regardless
  of which storage a caller actually configured. Any consumer whose client bundle imported
  `@zanix/logger` transitively (e.g. `@zanix/space` apps) hit this, even when the app never used
  the file-based default. `Logger`'s own module (`@zanix/utils/logger/client`, see below) no
  longer imports `WorkerManager` at all, not even dynamically — confirmed against a real, minified
  Vite build: no `new Worker(...)`, no `worker-entry` chunk. Every existing server-side consumer
  (`@zanix/utils/logger`, `@zanix/logger`) keeps its current automatic file-based default with no
  code changes required on their part.

### Added

- **`@zanix/utils/logger/client` — a new, browser-safe entrypoint for `Logger`** (`logger`) —
  `createClientLogger(fetcher)` builds a `Logger` whose default storage sends each log through
  `fetcher` instead of to a file. `fetcher` receives one already-formatted log entry per call as a
  typed object (`BaseFormattedLog`, `DefaultFormattedLog` by default) — never `JSON.stringify`'d
  on its behalf, so the caller decides whether/how to serialize it — typically sent to the app's
  own backend endpoint.
- **`Logger#ingest(type, ...data)`** (`logger`) — relays an already-formatted remote log (e.g. one
  received by a backend endpoint from a `createClientLogger` instance) through this instance's own
  configured save pipeline (redact, print, persist), the same as `warn`/`error`/etc., never
  `noSave` — letting a browser-originated log persist through whichever backend the server's own
  `Logger` instance is already configured with (file, Elasticsearch, a custom sink), with no
  separate wiring needed.
- **`saveDataFileFunction`** (`logger`) — the file-based `SaveDataFile` resolver, now exported
  publicly from `@zanix/utils/logger`, for a server-side caller that wants file-based storage
  explicitly — bypassing `Logger`'s own automatic default, or building a `createClientLogger`-style
  factory of its own.

## [3.0.3] - 2026-08-23

### Fixed

- **`getWebProcessWorker`'s `new Worker(...)` options broke a real Vite client build the moment
  its URL argument became a genuine `new URL('./worker-entry.ts', import.meta.url)`** (`workers`)
  — introduced as a side effect of `3.0.2`'s `worker-entry.ts` split, which changed the Worker
  constructor's first argument from a bare `import.meta.url` to that exact
  `new URL(..., import.meta.url)` shape. Vite's own `worker-import-meta-url` plugin specifically
  targets that shape for static analysis and needs `type` to resolve to a literal; a spread placed
  AFTER `type: 'module'` in the options object — present since `2.6.0`, but never actually
  exercised by Vite because the OLD bare-`import.meta.url` argument never triggered that plugin's
  parsing at all — made it fail with "Expected object spread to be used before the definition of
  the type property," aborting the whole build. Any consumer whose client bundle reaches this
  module transitively (e.g. `@zanix/space` apps, via `@zanix/logger`) hit this on every build. The
  spread now comes before `type`, an identical runtime object either way (it only ever contributes
  a `deno` key), confirmed against a real Vite 8.2.2/rolldown build.

## [3.0.2] - 2026-08-23

### Fixed

- **`WorkerManager` no longer hangs forever when the global `Znx` logger isn't installed**
  (`workers`) — `invokeTask` referenced `Znx.logger.error(...)` directly in its timeout,
  `onmessage`, and `onerror` handlers, but `Znx` is only defined once something has imported
  `modules/logger/mod.ts` somewhere in the process. A `WorkerManager` consumer who never does that
  hit a `ReferenceError` thrown inside those async handlers, silently swallowed before `onFinish`
  could ever run — leaving any caller awaiting the task's promise stuck forever with no visible
  error. These call sites now go through `getGlobalZnx()?.logger.error(...)`, falling back to
  `console.error` when no logger has been installed, so the error is always reported and
  `onFinish` always runs ([#7](https://github.com/zanix-io/utils/issues/7)).
- **Importing `@zanix/utils` (or `workers`/`logger`/`helpers`) no longer suppresses unhandled
  promise rejections process-wide** (`workers`) — `modules/workers/processor.ts` statically
  pulled in Worker-only runtime code (`self.onerror`, an `unhandledrejection` listener calling
  `preventDefault()`) as a side effect of import, meant to run only inside a spawned Worker's own
  isolated realm but actually running in whichever realm imported the module — including a host
  process's main thread, where it silently swallowed every unhandled rejection instead of letting
  Deno crash as expected. That runtime code now lives in a new `worker-entry.ts`, loaded only as a
  spawned Worker's own entry module and never statically imported by the host; `processor.ts`
  keeps just the side-effect-free `getWebProcessWorker` spawner
  ([#10](https://github.com/zanix-io/utils/issues/10)).
- **`classMetadata` now tags all ~22 catalog validation decorators with `meta.decorator`, not just
  6** (`validator`) — `ValidateNested`, `Match`, `IsUrl`, `IsNumberString`, `IsEmail`,
  `IsBooleanString`, `IsObjectID`, `Length`, `IsUUID`, `MinDate`, `MaxDate`, `IsPhone`, `IsDate`,
  `MinNumber`, `ArrayLength`, and `MaxNumber` registered with `decorator: undefined`,
  indistinguishable from a genuinely custom decorator to a downstream consumer (e.g. an OpenAPI
  generator) trying to map a field back to its decorator. Each now supplies its own
  `meta: { decorator: 'X', args: [...] }` through a new internal-only
  `defineCatalogValidationDecorator` — identical to the public `defineValidationDecorator` but
  with `meta` required, so a future catalog decorator that omits it fails `deno check`/`deno
  publish` at compile time instead of silently producing an untagged entry. The public
  `defineValidationDecorator` (and the `Validation()` custom-decorator helper) keep `meta`
  optional — that remains the escape hatch for consumer-authored custom decorators
  ([#11](https://github.com/zanix-io/utils/issues/11)).
- **`classMetadata` now reports every decorator stacked on a field, not just the last one
  registered** (`validator`) — `registerClassField` plain-overwrote a field's entry on each
  decorator registration, so a field carrying two or more decorators (e.g. `@IsString()
  @Length({ min: 1, max: 100 })`, or `@IsEmail() @Length({ max: 255 })`) only ever reported the
  last one applied, silently dropping every earlier decorator from a downstream consumer's view
  (e.g. an OpenAPI generator). `RTOFieldMetadata` gains a new `decorators` array — every decorator
  in the stack, in registration order — populated only when a field has more than one; a
  single-decorator field never carries it. `decorator`/`args` keep reflecting only the
  last-registered decorator, unchanged, so an existing consumer reading just those two fields
  keeps working identically. `each`/`optional`/`expose` are now OR-merged across a stacked field's
  decorators instead of overwritten, matching their real runtime behavior: `classValidation`
  treats a value as optional, or exposes it, the moment any decorator in the stack says so.

## [3.0.1] - 2026-08-22

### Added

- **`resetConfig()`** (`testing`) — clears `readConfig`'s memoized result, forcing its next call
  to re-read the config file from disk instead of returning the cached value. Test-only:
  production code relies on that cache staying warm for the process lifetime. Doesn't retroactively
  affect an already-resolved `Znx.config` (see the `Logger`/`setGlobalZnx` fix below) — that
  resolves independently, once, on its own first access, regardless of this call.

### Fixed

- **`readConfig` (`helpers`) now actually memoizes the config file it reads** — it compared the
  raw `configPath` argument against the previously _resolved_ path, so a call with no explicit
  path (the common case, e.g. every `logger.*()` call resolving the app name via
  `buildHeaderLog`) never matched and re-read and re-parsed the config file from disk on every
  single call. The comparison now happens against the resolved path instead, so a cache hit is
  recognized whenever the same file would be read again.
- **`Logger`/`setGlobalZnx` no longer touch disk merely by being imported** (`logger`, `helpers`)
  — `modules/logger/mod.ts` creates a default `Logger` instance at module load time, and its
  constructor used to call `readConfig()` (via `setGlobalZnx`) and evaluate the
  `Znx.config.project === 'library'/'app'` no-op-save check (via `baseSaveData`) both eagerly,
  right then — requiring `allow-read`/`allow-env` and a resolvable config path the instant
  anything imported the logger, before a single log was ever saved. Same class of bug
  `@zanix/asyncmq` already had to fix once for its own eager `readConfig()` call
  (`registerRabbitMQConnector`). `Znx.config` now resolves lazily, on its first real access, and
  self-materializes into a plain, mutable object from then on — direct mutation
  (`Znx.config.project = 'space'`, used throughout this package's own test suite) still works
  exactly as before; only the timing of the underlying disk read changes, never the public
  contract of `Znx`/`setGlobalZnx`/the logger's documented "just import and use it" usage.

## [3.0.0] - 2026-08-22

### Added

- **`_csrf` coverage in the default redaction pattern** (`errors/redact.ts`) — `_csrf` added to
  `SENSITIVE_KEY_PATTERN`, matched by exact equality like every other credential-shaped field
  except the `Csrf`-containment one below. Carries the exact same token as `X-Znx-Csrf`/
  `X-Znx-Csrf-Token`, over a third channel `@zanix/space`'s `csrfGuard` accepts it on — a plain
  HTML `<form>` submission's own field. Not customizable on `csrfGuard`, so an exact match is
  always accurate, unlike the cookie/header names.
- **`PUBLIC_COOKIE_ATTRIBUTES`** (`helpers`) — the shared `Path=/; Secure; SameSite=Lax` attribute
  string for a client-readable, non-session cookie: no `HttpOnly` (client-side JS must read it) and
  `SameSite=Lax` rather than `SESSION_COOKIE_ATTRIBUTES`'s `Strict` (must still be attached on a
  normal top-level cross-site navigation — a bookmark or external link landing on a
  `/es/...`-prefixed URL still needs the persisted preference recognized on that first request).
  Ahead of wiring `@zanix/space`'s `langGuard`/`langPreHandler`/`populationGuard` — all three
  currently hand-roll the literal `'Path=/; SameSite=Lax'` independently and are all missing
  `Secure`, the only place in a full 12-repo audit that omits it.
- **`assertZnxCookieName(name, sourceName, mustContain?)`** (`helpers`) — throws if `name` doesn't
  start with `X-Znx-`, the ecosystem-wide framework-cookie convention `@zanix/server`'s
  `cookiesGuard` silently enforces by dropping any non-conforming cookie from `ctx.cookies` before
  any guard/handler runs. The optional `mustContain` also throws (case-insensitively) if `name`
  doesn't contain a given keyword — for a customizable cookie name (e.g. a `csrfGuard`'s own
  `cookieName` option) that a fuzzy redaction/matching rule elsewhere depends on staying
  recognizable after customization. Meant to be called once, at construction time, never
  per-request. Centralizes a check `@zanix/space`'s `csrfGuard`/`langGuard`/`langPreHandler`/
  `populationGuard` will reuse instead of each re-deriving its own.
- **`X-Znx-Captcha-Token`/`captchaToken` coverage in the default redaction pattern**
  (`errors/redact.ts`) — `(?:x-znx-)?captcha[-_]?token` added to `SENSITIVE_KEY_PATTERN`, the same
  shape `(?:x-znx-app-)?token` already gives `X-Znx-App-Token`. Added ahead of `@zanix/auth`'s new
  `captchaGuard`, whose request header carries a bearer-shaped provider response token — a
  framework-owned credential-carrying header is redacted by default, not left to each consumer's
  own `RedactOptions.extend`.
- **Any `X-Znx-`-prefixed key containing `Csrf` is now redacted, by containment rather than exact
  match** (`errors/redact.ts`) — `x-znx-[\w-]*csrf[\w-]*` added to `SENSITIVE_KEY_PATTERN`. Every
  other entry matches by exact key equality; this one deliberately doesn't, because
  `@zanix/space`'s `csrfGuard` exposes its own cookie's name as a customizable `cookieName` option
  (default `X-Znx-Csrf`) — an exact-name entry would only ever catch the untouched default and
  silently miss a customized one. Safe specifically because `assertZnxCookieName`'s `mustContain`
  check (see above) guarantees any name `csrfGuard` actually accepts still contains `Csrf`
  somewhere, by construction.
- **`no-znx-console` auto-fix** (`linter`) — `console.log`/`console.info`/`console.warn`/
  `console.error` are now auto-fixable via `deno lint --fix`, rewriting each call site to its
  `logger` equivalent (`logger.debug`/`logger.info`/`logger.warn`/`logger.error`) and inserting
  the `logger` import. The fix resolves the real import alias from the linted file's own project
  `deno.json(c)` (never a hardcoded one), reuses an existing `logger` import in the file instead of
  adding a second one, and is skipped — leaving the file untouched, violation still reported — when
  the project doesn't declare `@zanix/utils`'s `/logger` subpath as a dependency. Any other
  `console.*` method (`console.table`, `console.trace`, ...) remains report-only.
- **`confinePath(rootDir, key)`** (`helpers`) — resolves `key` against `rootDir` and throws if the
  result lands outside `rootDir`, catching both a `../`-traversing `key` and an absolute `key`
  (which overrides `rootDir` outright when resolved, the same escape spelled differently) with one
  containment check. The standard guard for any storage/filesystem layer that maps a
  caller-supplied string onto a real path on disk.
- **`SESSION_COOKIE_ATTRIBUTES`** (`helpers`) — the shared `Path=/; HttpOnly; Secure;
  SameSite=Strict` attribute string every Zanix session/token cookie is built with, so that
  posture can't drift between the packages that each build their own `Set-Cookie` string.
- **`sanitizeUrl(value)`** (`helpers`) — neutralizes a value about to be used as a navigable
  `href`/`src`: rejects `javascript:`/`vbscript:` and non-image `data:` schemes (including one
  obfuscated with an embedded tab/CR/LF or a leading control character), returning `''` instead of
  letting them reach the DOM. Promoted from a package-local RichText helper, since a second real
  consumer needing the same URL-sanitization guarantee showed up.
- **`isPlainObject(value)`** (`helpers`) — type-guards `value` as a real object literal: not
  `null`, not an array, and not a class instance (`Date`, a Mongo `ObjectId`, etc. — checked via
  `Object.getPrototypeOf(value) === Object.prototype`), so a caller that walks a value's own
  enumerable properties never mistakes a constructed instance for a nested object to descend into.
  Promoted after the identical predicate turned up independently re-implemented in three different
  files across two packages.
- **`assertNoCrlf(field, value)`** (`helpers`) — throws if `value` carries a `\r` or `\n`, for a
  caller composing a raw protocol line by hand (an SMTP command, a hand-built header line) where
  an embedded line break would inject an extra line the caller never intended.
- **`ProxyTrustOptions`** (`helpers`) — the `trustProxyHeader`/`trustedHeaders` shape shared by
  {@linkcode getClientIp}'s callers: opt-in-and-explicit trust of a proxy-forwarded header,
  declared once so it doesn't get re-declared per guard that needs the same contract.
- **`RedactOptions.extend`** (`errors`, and therefore `Logger`'s own `redact` option) — a list of
  extra key names (a plain string, matched exactly and case-insensitively) or patterns (a `RegExp`,
  for a rule broader than one literal name) to redact _in addition to_ whichever pattern already
  applies (built-in, an app-wide `setDefaultRedactOptions` default, or this call's own `pattern`),
  instead of having to reconstruct that entire pattern from scratch just to add one more sensitive
  key name on top of it. `redactSensitiveData`'s own `pattern` parameter now accepts anything with a
  `.test(key)` method (a real `RegExp` still works directly) — the new `buildKeyMatcher` helper is
  what composes a base pattern with `extend` into one.
- **`Logger.high(...data)`** (`logger`) — a new log severity between `warn` and `error`: for an
  anomalous condition that deserves attention sooner than a routine `warn`, without necessarily
  meaning the operation itself failed outright (unlike `error`). Persisted by default, same as
  `warn`/`error`; dispatches through `console.error` (not `console.warn`) so stderr-only log
  aggregators still surface it, with its own `🟣`/magenta styling distinct from both neighbors.
  `LoggerMethods` gains `'high'`, and the new `ConsoleMethodFor<Method>` type (re-exported from
  `@zanix/utils/types`) expresses which real `console` method a given logger method maps to.
- **`IsObjectID` decorator, plus raw `isObjectId(value)`/`isObjectIdArray(value)` predicates**
  (`validator`) — validates a MongoDB `ObjectId` (a 24-character hexadecimal string) against
  `OBJECT_ID_REGEX`, the same pattern-validation shape every other `Is*` string decorator in this
  module already follows.

### Changed

- **BREAKING: every regex constant in `/regex` renamed to `UPPER_SNAKE_CASE`** — all ~17 exported
  and internal-only `RegExp` literals (`emailRegex` → `EMAIL_REGEX`, `uuidRegex` → `UUID_REGEX`,
  `phoneRegex` → `PHONE_REGEX`, `urlRegex` → `URL_REGEX`, `objectIdRegex` → `OBJECT_ID_REGEX`,
  `commentRegex` → `COMMENT_REGEX`, `isoDateRegex` → `ISO_DATE_REGEX`, `isoDatetimeRegex` →
  `ISO_DATETIME_REGEX`, `keyValueRegex` → `KEY_VALUE_REGEX`, `localTimeRegex` →
  `LOCAL_TIME_REGEX`, `securePasswordRegex` → `SECURE_PASSWORD_REGEX`, `singleQuoteRegex` →
  `SINGLE_QUOTE_REGEX`, `usernameRegex` → `USERNAME_REGEX`, `utcTimeRegex` → `UTC_TIME_REGEX`,
  `versionRegex` → `VERSION_REGEX`, `numericRegex` → `NUMERIC_REGEX`, `booleanRegex` →
  `BOOLEAN_REGEX`, `enclosedStringRegex` → `ENCLOSED_STRING_REGEX`, plus the module's private-only
  ones) — corrects a whole-file naming-convention deviation: a static `RegExp` literal with no
  mutable state is a conceptual constant and belongs in `UPPER_SNAKE_CASE`, per this project's own
  documented convention. No deprecated camelCase alias is kept (see rationale below) — this is a
  clean rename, not additive. Any code importing a named regex export from `@zanix/utils/regex`
  by its old camelCase name must update to the new `UPPER_SNAKE_CASE` name.

### Fixed

- `deno lint`'s own `@zanix/utils` plugin (`deno-zanix-plugin`) is now version-pinned
  (`^3.0.0`, matching this same release) instead of resolving unpinned, so a lint run can no
  longer silently pick up a newer, unreviewed plugin version.
- **`compareUint8Arrays` (`helpers`, and `verifyHMAC` which relies on it) now runs in constant
  time with respect to its content.** It used to return as soon as it found a mismatching byte —
  timing that leaks how many leading bytes of a caller-supplied guess happened to match a secret
  (an HMAC signature, an API key), letting a remote attacker recover it one byte at a time instead
  of needing the full keyspace. Every index is now read regardless of where a mismatch occurs; a
  length mismatch still returns immediately, since a fixed-length secret's length carries no
  information about its actual bytes.
- **`stripComments` (`helpers`/`stripComments` internal, used by `readConfig`/`readModuleConfig`
  and the `zanix-logger` lint rule) no longer corrupts a JSONC string value that happens to contain
  a `//`- or `/* ... */`-shaped substring** — a glob like `"src/@tests/**/*.test.ts"` used to come
  back as `"src/@tests*.test.ts"`, because the previous regex-based implementation had no awareness
  of JSON string boundaries and read the four characters right after `@tests` as a real block
  comment. `stripComments` now walks the input character by character, tracking whether it's
  inside a double-quoted string (respecting `\"`/`\\` escapes), and only treats `//`/`/* ... */` as
  a comment when outside of one. An unterminated block comment is left untouched rather than
  silently consuming the rest of the input. The function's signature is unchanged.
- **`deno doc --lint` no longer reports 4 pre-existing errors on `LoggerFileOptions`/
  `LoggerFunctionOptions`** — both were missing their own JSDoc, and both referenced the private
  `BaseLoggerOptions`/`BaseStorage` types. `BaseLoggerOptions` and `BaseStorage` are now exported
  (from `typings/logger.ts` and re-exported from `@zanix/utils/types`) and `LoggerFileOptions`/
  `LoggerFunctionOptions` each have a one-line doc comment; no behavior change.
- **`docs/helpers.md` and `docs/logger.md` now document `confinePath`, `SESSION_COOKIE_ATTRIBUTES`,
  and `DEFAULT_REDACT_PATTERN`** — all three were already real exports (`confinePath` and
  `SESSION_COOKIE_ATTRIBUTES` new in this same release, above) with no documented home in `docs/`.
- **`docs/types.md`'s `LoggerMethods`/`ConsoleInfo` rows were stale** — they still listed the
  method set from before `logger.high` was added and omitted the `ConsoleMethodFor` type it
  introduced; both rows now match `typings/logger.ts`, and `ConsoleMethodFor` has its own row.

## [2.6.1] - 2026-08-19

### Added

- **`getTemporaryFolder(callerUrl, unique?)`** (`helpers`) — a new optional second parameter.
  Omitted (the original behavior), it still returns the one fixed `__tmp__` path shared by every
  caller at that location. Set — `true`, or a string for that subfolder's own name prefix — it
  instead returns a FRESH, uniquely-named subfolder of `__tmp__` on every call (via
  `Deno.makeTempDirSync`), for callers (or concurrent test runs) that need their own isolated
  scratch space and must not collide with, or clobber via cleanup, another caller's files —
  without giving up `__tmp__`'s own git-ignored, alongside-the-module convention the way a plain
  `Deno.makeTempDir()` call (rooted in the OS temp dir instead) would.

### Fixed

- **`logger`'s console header, outside Deno** — every `Logger` call (`info`/`warn`/`error`/etc.)
  built its own colored header via `@std/fmt/colors`, unconditionally — real ANSI escape codes,
  meant for a terminal. A browser console doesn't interpret those at all: they printed as raw
  control-sequence bytes rather than color, a real (if cosmetic) regression for `logger` calls
  reached from browser-bundled code (a real, current caller: `@zanix/space-ui`'s `Modal`, whose
  dev-time accessibility warning fires from hydrated client code, not just SSR). `buildHeaderLog`
  now branches on `typeof Deno === 'undefined'`: the terminal path is byte-for-byte unchanged, and
  the browser path builds a `['%c...', cssString]` pair instead — the browser devtools' own
  equivalent to ANSI coloring, consumed positionally by `console[method]` the same way `%s`/`%d`
  are. `baseHeaderLog` (the `Logger`-internal entrypoint every level ultimately calls through
  `showMessage`) decides which branch from the real `typeof Deno` check; the branch-building logic
  itself (`buildHeaderLog`) takes `isBrowser` as a plain parameter instead, so both paths stay
  unit-testable without needing to undefine the real `Deno` global mid-suite.

## [2.6.0] - 2026-08-15

### Added

- **`toKebabCase`/`toPascalCase`** (`helpers`) — casing-convention conversion for identifiers,
  moved here from `@zanix/cli` (its own `utils/casing.ts`), the only consumer until now: generic,
  reusable string primitives belong in `@zanix/utils`, not in a specific CLI's own `utils/` folder
  (matching the same split already applied to path/config resolution and file-existence checks —
  see `@zanix/cli`'s own `engineering.md` §3, "Config-split precedent"). `toPascalCase` now reuses
  `capitalize` internally
  for each word's own capitalization, instead of duplicating that logic inline. See
  [Utils](docs/utils.md#capitalization--casing) for the full reference, including how these differ
  from `capitalize`/`capitalizeWords`.
- **Redaction for errors and logs**: `redactSensitiveData`, `createRedactor`,
  and `setDefaultRedactOptions` (from `/errors`), plus the accompanying
  `RedactOptions` type. Every log (console and whatever storage strategy is
  configured) and every `serializeError`/ `serializeMultipleErrors` call now
  redacts credential-shaped fields (`authorization`, `cookie`, `password`,
  `token`, `secret`, `apiKey`, and similar names, matched case-insensitively) by
  default, and converts a raw `Headers`/`Request` value to its safe, named
  fields before that same key-based redaction applies — covering a case
  `JSON.stringify` alone would miss, since Deno's own console inspector still
  prints a `Headers`/`Request`'s full contents even though it serializes to `{}`
  under `JSON.stringify`. `Logger` gets a new `redact` option (`true` by
  default) to control this per instance; `setDefaultRedactOptions` changes the
  shared, process-wide fallback that any caller without its own explicit
  `redact` falls back to — notably `serializeError` calls with no `redact` of
  their own, e.g. `@zanix/server`'s client-facing error responses, which
  previously had no way to share a `Logger`'s custom redaction pattern at all.
  Documented in [docs/logger.md](docs/logger.md#redacting-sensitive-data) and
  [docs/errors.md](docs/errors.md#serializing-errors).
- `use-znx-flags`: a new `deno-zanix-plugin` lint rule validating Zanix
  directive-prologue flags (a bare string-literal expression statement as a
  file's first statement, the same grammar slot as `'use strict'`) against a new
  `ZNX_FLAGS` constant — currently just `'use comet'`, the marker
  `@zanix/space`'s `cometPlugin` looks for. An unrecognized flag in that
  position is now a lint error instead of silently doing nothing. Documented in
  [docs/linter.md](docs/linter.md#deno-zanix-plugin) and
  [docs/utils.md](docs/utils.md#constants).
- `jsxImportSource` compiler option on `ConfigFile['compilerOptions']` — the
  module specifier `jsx: 'react-jsx'`/`'react-jsxdev'` imports its runtime
  helpers from, required alongside those two modes.
- `WorkerManager`'s constructor now accepts an optional second `createWorker`
  argument, a factory used in place of the default `getWebProcessWorker`
  whenever the pool needs a new worker — mainly useful for tests that need to
  simulate worker behavior (e.g. forcing an error) without a real Web Worker.
  Documented in [docs/workers.md](docs/workers.md#custom-worker-creation).
- `WorkerManager`'s constructor options gain
  `permissions?: Deno.PermissionOptions` — restricts what every worker THIS pool
  creates may do (`net`/`read`/`write`/`env`/`run`/`ffi`/`sys`), forwarded as-is
  to `Worker`'s own `deno.permissions` option (a worker's permissions can never
  exceed its parent's own — Deno's own API enforces that). Omit entirely (the
  default) for unchanged, unrestricted behavior. Real sandboxing for
  untrusted/CPU-bound task code — not a CPU-time or memory quota, which Deno's
  `Worker` API has no option for today; `options.timeout` remains the only
  available protection against a runaway task. Requires the still-unstable
  `worker-options` Deno feature (this package's own `deno.jsonc` now declares
  `"unstable": ["worker-options"]`; any consumer using `permissions` needs the
  same, either via config or `--unstable-worker-options`) and, since an explicit
  permission object replaces the whole set rather than inheriting unlisted
  categories, must itself grant enough `read`/`net` for the worker to import its
  own task module in the first place. Documented in
  [docs/workers.md](docs/workers.md#restricting-a-workers-permissions-real-sandboxing).

### Changed

- **Breaking:** the `ZanixProjects` project-type union changed shape: `'app'`
  (previously the `@zanix/space`-predecessor frontend-app type, backed by
  `ZanixAppSrcTree`) is now `'space'`, and `'app-server'` is now
  `'space-server'`. `'app'` is repurposed for a lightweight, non-runnable
  package type, treated the same as `'library'` (see below) — it has no
  dedicated entry in `ZanixSrcTreeMap`. `ZanixAppSrcTree` is replaced by
  `ZanixSpaceSrcTree`, matching `@zanix/space`'s real, implemented conventions
  (file-based routing under `routes/`, selective-hydration components under
  `comets/`) instead of the previous `Components/Layout/Pages/resources` shape,
  which was never reconciled against `@zanix/space`'s actual implementation.
  `ZanixSrcTreeMap`/ `ZanixFolderTree` updated to match. Documented in
  [docs/types.md](docs/types.md#zanix-framework-types).
- Default log-file storage (`baseSaveData`) now also skips creating a log file
  for `'app'`-type projects, the same way it already did for `'library'` — like
  a library, an `'app'` package isn't necessarily a deployed long-running
  process on its own.
- The default logger formatter now serializes any `Error` instance passed as
  extra data to `info`/`warn` (previously only `error` handled this), preventing
  it from silently collapsing to `{}` when persisted — `Error`'s own properties
  are non-enumerable, so a naive `JSON.stringify` drops them.
- `nextCronDate`'s field parser (`parseField`) now skips an invalid or empty
  numeric field (an empty string, a non-numeric range/step/single value) instead
  of adding `NaN` to the resulting set. The "invalid cron expression" log
  message changed from "empty field" to "no valid values found for a field" to
  match.

### Removed

- **Breaking:** `hash` removed from `ConfigFile['zanix']` and from
  `ZanixGlobal['Znx']['config']`. It was only ever written (by `@zanix/cli`'s
  `baseZnxConfig`/`configAdaptation`), never read by any real consumer anywhere
  in the ecosystem — confirmed by an exhaustive audit. `ZanixProjectSrc` (the
  type that added a `zanix: ZanixBaseFolder` folder-tree entry to
  `ZanixFolderTree` for non-library project types) is also removed —
  `@zanix/cli`'s `zanix new` no longer scaffolds a `zanix/` folder (its
  `config.ts`/`secrets.sqlite` content was always empty, fetched from an
  `@zanix/core` `src/templates/` that has never had any content).

### Fixed

- `WorkerManager`'s timeout handling never actually settled the task: on a
  genuine timeout it terminated the worker but never called `onFinish`, so any
  caller awaiting the result (any Promise-wrapping caller of
  `.task(...).invoke(...)`) would hang forever instead of ever rejecting. A
  related bug left the terminated worker's pool slot parked in `'busy'` status
  forever unless a queued task happened to be waiting when the timeout fired —
  otherwise it could later be silently handed a new task by round-robin
  selection, which would then hang too, since a terminated worker can never
  respond. Both are fixed: a timeout now always calls `onFinish` with an error,
  and always replaces the slot with a fresh worker regardless of whether a task
  was queued.
- `readModuleConfig` ignored its own `metaUrl` parameter for local files and
  read `deno.jsonc` relative to `Deno.cwd()` instead — contrary to its
  documented contract. This made `@zanix/cli` (the only real consumer) silently
  fail to identify itself (wrong or missing name/version) whenever invoked from
  a directory other than its own, when run from a local `file:` path rather than
  a `deno install`ed JSR module. Now resolves by walking up from `metaUrl`'s own
  directory, mirroring how the JSR-fetch branch already strips a module subpath
  down to its package root.
- `HttpError` threw evaluating its own module (`@zanix/utils/errors`) outside
  Deno, since it directly referenced `Deno.errors.Http` at the class-declaration
  level — a real crash importing the module from browser-run code (e.g.
  `@zanix/space`'s `defineComet`), confirmed the hard way, since ESM evaluates a
  whole module's top-level code regardless of which export a consumer actually
  uses. `HttpError` now extends a new `HttpErrorBase` that resolves to
  `Deno.errors.Http` only when `Deno` exists, falling back to plain `Error`
  otherwise — `HttpError`'s own public behavior
  (`.message`/`.status`/`.stack`/`.cause`/`.meta`/`.code`) is unaffected either
  way, since every one of those is set directly in its own constructor.

## [2.5.1] - 2026-08-04

### Fixed

- Fixed unused dependencies

## [2.5.0] - 2026-08-04

### Removed

- **Breaking:** the project-scaffolding cluster moved to `@zanix/cli`, its only
  real consumer — `compileAndObfuscate` (and the `builder` module),
  `prepareGithub` (and the `github` module's hooks/workflows/files helpers),
  `createVSCodeConfig` (and the `editor` module), `getZanixPaths`,
  `getAllZanixLibrariesInfo`, `ZanixTree`/`BaseZanixTree`, and the
  per-project-type tree builders (`getServerSrcTree`, `getAppSrcTree`,
  `getLibrarySrcTree`, `getZnxFolderTree`, `getCommonTree`). Along with them,
  the option types that described them are no longer exported from `/types`:
  `CompilerOptions`, `PrepareGithubOptions`, `Editors`,
  `BaseGithubHelperOptions`, `HookOptions`, `WorkflowOptions`,
  `PreCommitHookOptions`, `BaseEditorHelperOptions`. The Zanix project/folder
  `type` definitions themselves (`ZanixFolderTree`, `ZanixServerSrcTree`,
  `ZanixAppSrcTree`, `ZanixLibrarySrcTree`, `ZanixLibraries`, and related
  shapes) are unaffected and remain exported from `/types` — only the runtime
  code that built/consumed them moved.
- `getSrcDir`, `getSrcName`, and `getLatestRelease` — confirmed unused anywhere
  in the Zanix ecosystem, removed outright rather than migrated.

### Fixed

- Added a verbose option to WorkerManager for enhanced logging during execution.

## [2.4.5] - 2026-08-01

### Changed

- `collectFiles` now accepts a single root path or an array of roots, traversing
  all of them for matching files instead of requiring a separate call per
  directory.

## [2.4.4] - 2026-07-30

### Fixed

- `createGitWorkflow`'s custom `mainBranch` replacement only patched the first
  `${MAIN_BRANCH}` placeholder in the generated `publish.yml`, leaving the
  second occurrence (the `push.branches` trigger) as the literal, unresolved
  placeholder instead of the custom branch name. The replacement is now applied
  globally, so both the `pull_request` and `push` triggers pick up the custom
  branch.
- The Zanix **server** project scaffold attributed its `jobs` and `repositories`
  (model/seeder) templates to `@zanix/server`, even though their content
  demonstrates `registerCronJob` and `registerModel` — APIs owned by
  `@zanix/asyncmq` and `@zanix/datamaster` respectively. Since both of those
  libraries depend on `@zanix/server`, claiming ownership there implied a
  circular dependency in the generated project's template metadata. Ownership is
  now attributed to whichever library actually owns each API.

### Changed

- The common Zanix project scaffold now generates `CHANGELOG.md` and `LICENSE`
  at the project root (alongside `README.md`) instead of under `docs/`, and
  seeds `docs/` with a starter `see-more.md` guide for project-specific
  documentation links. The generated `README.md` template links to it and was
  updated to match the new root-level `CHANGELOG.md`/`LICENSE` paths.

## [2.4.3] - 2026-07-28

### Added

- Added a dedicated **Network & IP utilities** documentation page covering IPv4
  helpers, CIDR parsing and matching, client IP normalization, and trusted proxy
  header extraction.
- Documented the IP-related helpers:
  - `TrustedHeader`
  - `ParsedCidr`
  - `ipv4ToInt`
  - `parseCidr`
  - `isIpInParsedCidr`
  - `isIpInCidr`
  - `normalizeClientIp`
  - `getClientIp`

### Changed

- Split the documentation into smaller, topic-focused pages for easier
  navigation.
- Moved the **GitHub automation** reference from `helpers.md` to a dedicated
  `github.md` page.
- Moved the **Build** reference from `helpers.md` to a dedicated `build.md`
  page.
- Updated the cross-references in `helpers.md` to point to the new documentation
  pages.

## [2.4.2] - 2026-07-26

### Added

- Re-exported `LoggerOptions`, `LoggerFunctionOptions`, `LoggerFileOptions`,
  `SaveDataFunctionOptions`, `SaveDataFile`, and `SaveDataFileOptions` from
  `@zanix/utils/types` — previously internal-only types needed to annotate a
  custom `Logger` `storage.save` factory's return type without reaching into
  `@zanix/utils`'s own internals.
- Documented a sixth `Logger` storage style in
  [docs/logger.md](docs/logger.md#6-building-a-reusable-storage-backend):
  packaging a reusable storage backend as a factory function that returns a
  `SaveDataFunction` (e.g. `@zanix/datamaster`'s `elasticsearchLogSave`), plus
  guidance on aliasing the default formatter's `timestamp` field to a
  backend-specific convention (e.g. Elastic Common Schema's `@timestamp`)
  instead of synthesizing a new one.

## [2.4.1] - 2026-07-26

### Added

- Added `planCodeSync`, a storage-agnostic helper for reconciling code-defined
  entries with persisted records while preserving manual edits. Introduced the
  accompanying `StaticSyncEntry`, `PersistedSyncEntry`, and `SyncPlan` helper
  types for reusable code-to-storage synchronization logic.

## [2.4.0] - 2026-07-25

### Added

- `base32Encode`/`base32Decode`: RFC 4648 Base32 codec (uppercase `A-Z2-7`
  alphabet, unpadded encode, lowercase/padding-tolerant decode) — the format
  authenticator-app secrets (TOTP) are conventionally shown in.
- `signHMACBytes`: a raw-bytes HMAC helper supporting the full `HashAlgorithm`
  range, including `'SHA-1'`, which `signHMAC` deliberately excludes (JWT has no
  HS1 algorithm). Takes the key and data as `Uint8Array` instead of `signHMAC`'s
  UTF-8 `string`, since round-tripping an arbitrary binary key through a JS
  string would corrupt bytes ≥128.
- `interpolateEnv`: resolves `${{ENV_VAR}}` placeholders against `Deno.env`,
  recursing into arrays/objects the same way `interpolate` does. A separate
  convention from `interpolate`'s `{{field}}` so both can coexist in the same
  string — an unset variable is substituted as the literal text `'undefined'`
  rather than throwing.

### Changed

- `interpolate`: no longer matches `{{...}}` when immediately preceded by `$`,
  so `${{ENV_VAR}}` placeholders are left untouched for `interpolateEnv` to
  resolve instead of being treated as `interpolate`'s own field syntax.
- `cleanRoute`: Added the `keepCase` option to preserve the original route
  casing during normalization.

## [2.3.0] - 2026-07-24

### Added

- `toSearchParams`: builds a `URLSearchParams` from a plain object — the reverse
  direction of `getProcessedParams`, using the same array/nested-object
  conventions so the two round-trip.
- `interpolateUrl`: interpolates `{{field}}`/`{{nested.path}}` placeholders in a
  URL template. The path portion is interpolated as plain text; a query value
  that is exactly one placeholder is expanded via `toSearchParams` (arrays
  become repeated keys, nested objects use bracket notation) instead of being
  stringified.
- New template-interpolation primitives (`getPath`, `matchWholePlaceholder`,
  `interpolate`) for resolving `{{field}}`/`{{nested.path}}` placeholders
  against a record — the building blocks behind `interpolateUrl`, also usable
  standalone.
- `Semaphore` and `LockManager`: concurrency primitives for limiting
  simultaneous access to a resource (fixed permit count) and for exclusive
  per-key locking.
- `nextCronDate`: computes the next execution `Date` matching a 6-field cron
  expression (`second minute hour day month weekday`).
- `cleanRoute`: normalizes a route path (backslashes, repeated slashes,
  whitespace, casing).
- `processUrlParams`: recursively `decodeURIComponent`s every string value
  inside an object or array, in place.

## [2.2.17] - 2026-07-23

### Fixed

- Restored the `@module` tag on the `validator` re-export in `mod.ts` (removed
  by mistake in 2.2.16): the fix for JSR's Overview tab showing that comment
  instead of `README.md` is the package's "Readme Source" setting on jsr.io, not
  removing the module doc — removing it broke the "Has module docs in all
  entrypoints" score item instead.
- Added the missing `@module` tag (with a real summary) to the 7 entrypoints
  that never had one: `/helpers`, `/validator`, `/logger`, `/testing`,
  `/workers`, `/errors`, and `/types`, so every entrypoint declared in
  `deno.jsonc`'s `exports` now satisfies JSR's module-doc score check.

## [2.2.16] - 2026-07-23

### Fixed

- Removed the `@module` tag from the `validator` re-export in `mod.ts`: JSR's
  package Overview page prioritizes a `@module`-tagged doc comment on the main
  entrypoint over the actual `README.md`, which made the Overview show that
  comment's text instead of the real README.
- Bumped `actions/checkout` (`v4` → `v5`) and `denoland/setup-deno` (`v1` →
  `v2`) in the publish workflow and its scaffolding template
  (`publish.base.yml`), resolving a Node.js 20 deprecation warning on GitHub
  Actions runners.

### Changed

- Documented the remaining undocumented private fields on `WorkerManager`
  (`workers`, `#tasks`, `#workerIx`) and replaced a placeholder comment on
  `HttpError`/`ApplicationError`'s `_logged` field with a description of its
  actual purpose (de-duplicating repeated logs of the same error).

## [2.2.15] - 2026-07-23

### Added

- Full public type coverage for the `/types` entrypoint: ~35 previously-internal
  types are now exported and documented, resolving all `deno doc --lint`
  `private-type-ref` errors (except a documented exception for the third-party
  `esbuild` `BuildOptions`/`Plugin` types).
- `IsBooleanString`/`isBooleanString`/`isBooleanStringArray` are now exported
  from the `/validator` entrypoint (the decorator existed but was unreachable
  from outside the package).
- Complete documentation set under `docs/`: validator, helpers, utils,
  encryption & masking, logger, workers, errors, linter plugins, and a full
  types reference, each cross-linked and with runnable examples verified against
  the real implementation.
- Expanded test coverage (branch, function, and line) across validation
  decorators, GitHub/editor helpers, config, masking, and worker/project-tree
  caching.

### Fixed

- `getAppSrcTree`/`getServerSrcTree`/`getCommonTree` memoization never actually
  cached anything (a missing assignment), so the full Zanix folder tree was
  rebuilt on every call instead of reusing the cached one.
- `createPreCommitYaml` was missing an `await`, letting
  `pre-commit install`/`autoupdate` run before the `.pre-commit-config.yaml`
  file had finished being written.
- The `Zanix`/`DefaultLogger` type aliases depended on an ambient global that
  JSR's slow-types checker cannot resolve, which made `deno publish` fail
  outright.
- Corrected several outdated JSDoc comments across `errors`, `workers`,
  `encryption`, GitHub helpers, and linter plugins: wrong option defaults,
  swapped RSA public/private key descriptions, descriptions copied from a
  sibling symbol without updating them, and a reference to a `zanixFlags` rule
  that no longer exists.

### Removed

- `src/modules/helpers/environment.ts` and `src/modules/helpers/zanix/flags.ts`
  — orphaned files with no consumers.

## [2.2.14] - 2025-12-19

### Added

- Worker task modules are now cached after the first import, avoiding a
  redundant dynamic import on every subsequent call to the same task.

## [2.2.13] - 2025-12-17

### Added

- Worker manager pool for efficient worker management and reuse

## [2.2.12] - 2025-12-07

### Fixed

- Fixed an issue with the number transformation validation.

## [2.2.7] - 2025-11-24

### Added

- Introduced a new validation decorator.

## [2.2.6] - 2025-11-19

### Added

- **Private fields support in error classes**: Errors now support private
  fields, including a new `_logged` field, to improve error tracking and
  management. This allows better control over whether an error has been logged,
  preventing duplicate logs.

- **`ApplicationError` class enhancement**: The `ApplicationError` class has
  been extended to include additional flexibility, improving the structure for
  handling application-level errors. This allows custom errors to integrate
  seamlessly with error logging systems and better track error states.

### Changed

- Updated internal error classes to make use of private fields for tracking
  error states more effectively.
- Serialized errors can now include or exclude the stack trace based on the
  user's selection.

## [2.2.4] - 2025-11-19

### Changed

- Replaced Higher-Order Component (HOC) files with `defs` files to unify module
  definitions and centralize DSL-based declarations, metadata, and foundational
  structures. This improves consistency and simplifies the architecture for
  components like handlers, interactors, providers, and connectors.

## [2.2.3] - 2025-11-17

### Added

- **New helper TTL**: Introduced helper for parsing TTL.

## [2.2.2] - 2025-11-15

### Changed

- Obfuscator dependencies

## [2.2.1] - 2025-11-14

### Added

- **New asymmetric HMAC signing**: Introduced support for asymmetric HMAC
  signing, allowing for enhanced security with keys for signature generation and
  verification.

- **New error handling**: Introduced new custom error types for better error
  management.

### Changed

- **AES Encryption**: Added support for generating AES keys and performing AES
  encryption with any key type.

## [2.2.0] - 2025-11-05

### Changed

- `TaskerManager` has been replaced with the new `WorkerManager`, providing an
  improved API and extended usage options.

### Added

- Support for different worker execution modes (e.g., auto-closing, background
  execution).
- Simplified task invocation with new helper methods.
- Improved error handling and lifecycle management for worker tasks.

## [2.1.10] - 2025-11-02

### Fixed

- Validate after unmasking

## [2.1.9] - 2025-11-02

### Fixed

- Hashing vulnerability

## [2.1.8] - 2025-11-01

### Added

- Internal code and meta options to httpError
- Internal error class
- Error types

### Fixed

- encrypt and mask generic types

## [2.1.7] - 2025-10-26

### Changed

- UUID basic reeplaced by v4

## [2.1.6] - 2025-10-24

### Changed

- Encryption keys to use string keys allways

## [2.1.5] - 2025-10-20

### Added

- Symmetric and asymmetric encryption.
- Masking.
- Unidirectional encryption.
- Signing.

## [2.1.4] - 2025-10-17

### Fixed

- Github configuration helpers

## [2.1.3] - 2025-10-16

### Fixed

- Pre commit types

## [2.1.2] - 2025-10-16

### Fixed

- Read config file from jsonc

### Added

- Pre commit framework support

## [2.1.1] - 2025-04-11

### Added

- Recursive file reader function `collectFiles`.
- Generate hash helper `generateHashHex`.

### Fixed

- Format linter Max line width for string templates.
- RTO types.

### Removed

- Zanix Flags constants.
- Zanix Flags linter rules.

## [2.1.0] - 2025-03-26

### Added

- Class validation module. A Validations module for BaseRTO-based requests,
  using native ECMAScript features.

## [2.0.9] - 2025-03-20

### Added

- HttpError id props for trazability.

### Fixed

- Serialized error causes.

### Removed

- Remove Serialized errors for production environment.

## [2.0.8] - 2025-03-18

### Fixed

- Serialized errors for production environment.
- Correct Github initialization on helper.

## [2.0.7] - 2025-03-18

### Added

- New github, editor and workflow helper options.

### Fixed

- Github helper creation file validation when exists.

## [2.0.6] - 2025-03-17

### Added

- `readModuleConfig` for specifics modules (local or remotes).

## [2.0.5] - 2025-03-17

### Fixed

- Zanix namespace definition without config file.

## [2.0.4] - 2025-03-17

### Fixed

- Esbuild npm external libraries compatibility
- Zanix templates content for different startingpoint.

## [2.0.3] - 2025-03-16

### Added

- Template content for Zanix files tree.

### Fixed

- Zanix paths, and `regex` y `constants` documentation.
- Znx initialization.
- Format linter line-width for imports.
- Esbuild options and plugins for default modules and

## [2.0.2] - 2025-03-13

### Added

- Some documentation.
- New constants.
- New regexps.
- New Zanix utilities, for Zanix Framework purposes.

### Changed

- Exported modules on `constants` and `regex`
- Zanix Tree update for `Zanix` libraries.

## [2.0.1] - 2025-03-12

### Fixed

- Some documentation
- `getZanixPaths` helper to allows custom root dir.
- Lint stagged file patterns

## [2.0.0] - 2025-03-11

### Added

- `Types` module.

### Changed

- Several Zanix utilities have been removed and migrated to @zanix/cli.
- Main module exports have been updated.

### Fixed

- Read file from current URL on `createPreCommitHook`, `createPrePushHook`,
  `createPublishWorkflow` and `createIgnoreBaseFile`

## [1.1.0] - 2025-03-10

### Added

- `Errors` module: Custom `HttpErrors` and utility functions.
- GitHub Actions and helpers to automate the creation of hooks.
- Editor helpers to automate the creation of settings.

### Fixed

- Some default documentation.
- Logger default instance to get previous global instance.

## [1.0.0] - 2025-03-09

### Added

- A logger module.
- A testing module for mocks.
- A workers module for using basic taskers.
- Comprehensive documentation for the `Zanix Utils` library.
- Export of existing modules, making them usable both within and outside the
  Zanix ecosystem.
- Unit tests to ensure the library's functionality and reliability.
- New `require-access-modifier` rule added to `deno-std-plugin`.
- New `no-znx-console` rule added to `deno-zanix-plugin`, similar to
  `no-console`.
- `Zanix` namespace for global use in modules and types.

### Changed

- Renamed the plugin `deno-standard-plugin` to `deno-std-plugin`.
- Enabled the `deno-zanix-plugin` as a separate module.
- Renamed some flags in the `use-znx-flags` validation rule of
  `deno-zanix-plugin`.

### Fixed

- Fixed some issues in `deno-fmt-plugin`.

## [0.1.0] - 2025-03-04

### Initial Release

- First version of `Zanix Utils`.
- Provides linting rules and utilities to improve code quality in projects using
  the Zanix framework.
