# Linter plugins

`@zanix/utils` ships four [`Deno.lint`](https://deno.com/) plugins as
independent subpath exports, so a consumer can pull in only the rules it needs
instead of the whole package. Each plugin is a plain `Deno.lint.Plugin` object
(`{ name, rules }`) and can be dropped straight into the
`"lint": { "plugins": [...] }` array of a `deno.json`/`deno.jsonc` file:

```jsonc
{
  "lint": {
    "plugins": [
      "jsr:@zanix/utils@[version]/linter/deno-fmt-plugin",
      "jsr:@zanix/utils@[version]/linter/deno-std-plugin",
      "jsr:@zanix/utils@[version]/linter/deno-test-plugin"
    ]
  }
}
```

Every diagnostic reported by these plugins uses the same message format: a
leading `❌` followed by the human-readable description (see
`linterMessageFormat` in `src/modules/linter/commons/message.ts`). The
diagnostic `id` is always `<plugin-name>/<rule-name>`, for example
`deno-fmt-plugin/single-quote`.

The plugins can also be imported directly and run programmatically through
`Deno.lint.runPlugin(plugin, fileName, code)`:

```typescript
import formatPlugin from 'jsr:@zanix/utils@[version]/linter/deno-fmt-plugin'

const diagnostics = Deno.lint.runPlugin(
  formatPlugin,
  'fileName.ts',
  `const fs = "double quote";`,
)
```

## `deno-fmt-plugin`

Formatting-related rules. Source: `src/modules/linter/plugins/format/mod.ts`.

| Rule name      | What it checks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Example message                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `single-quote` | String literals enclosed in double quotes instead of single quotes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `❌ Use single quotes instead of double quotes.`                   |
| `line-width`   | Lines that exceed the maximum allowed width (100 characters), with exceptions for `import` lines, comments, and a few other cases handled internally. Not redundant with `deno fmt`'s own wrapping — this rule only ever sees what `fmt` declines to touch (a string literal, a comment), since the shared pre-commit hook runs `deno fmt` immediately before `deno lint`. Every string literal's own content is swapped for a short placeholder before a line's width is measured against the limit, so a line is exempt only when the surrounding CODE (not the string content) already fits — a `Deno.test('a long descriptive name', fn)` call is exempt, but a genuinely long call/chain with no string at all still gets reported. | `❌ The line exceeds the maximum allowed width of 100 characters.` |

Real diagnostic captured with `Deno.lint.runPlugin`:

```typescript
import formatPlugin from 'jsr:@zanix/utils@[version]/linter/deno-fmt-plugin'

Deno.lint.runPlugin(
  formatPlugin,
  'test.ts',
  `const a = "This is double quoted";`,
)
// [{
//   id: 'deno-fmt-plugin/single-quote',
//   message: "❌ Use single quotes instead of double quotes.",
//   hint: 'Consider reviewing the formatting plugin.',
//   range: [10, 33],
//   fix: []
// }]
```

Add it to `deno.jsonc`:

```jsonc
{
  "lint": {
    "plugins": ["jsr:@zanix/utils@[version]/linter/deno-fmt-plugin"]
  }
}
```

## `deno-std-plugin`

General-purpose standard rules for Deno/TypeScript codebases. Source:
`src/modules/linter/plugins/standard/mod.ts`. Note that the subpath is
`deno-std-plugin`, not `deno-standard-plugin`.

| Rule name                 | What it checks                                                                                                                                                                                                                                           | Example message                                                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-require`              | Usage of the CommonJS `require()` function instead of `import`.                                                                                                                                                                                          | `❌ Don't use require() calls to load modules.`                                                                                                                             |
| `no-useless-expression`   | Expression statements with no effect (a bare `SequenceExpression`, a non-first-position bare `Literal`, an immediately-invoked `FunctionExpression`, a bare `LogicalExpression`, or an `injectGlobal` tagged template).                                  | `❌ Unnecessary expression.`                                                                                                                                                |
| `require-access-modifier` | Class methods or properties without an explicit `public`, `private`, or `protected` modifier (constructors and `#private` members are exempt). Reports one of two distinct messages depending on whether the offending member is a method or a property. | `❌ Methods should have an explicit access modifier (public, private, protected).` or `❌ Properties should have an explicit access modifier (public, private, protected).` |

Real diagnostics captured with `Deno.lint.runPlugin` against a class with an
undecorated property and method:

```typescript
import standardPlugin from 'jsr:@zanix/utils@[version]/linter/deno-std-plugin'

Deno.lint.runPlugin(
  standardPlugin,
  'test.ts',
  `class A {
    property
    method(){
      return 1;
    }
  }`,
)
// [
//   {
//     id: 'deno-std-plugin/require-access-modifier',
//     message: "❌ Properties should have an explicit access modifier (public, private, protected).",
//     hint: 'Add a public, private, or protected modifier to the property.',
//     ...
//   },
//   {
//     id: 'deno-std-plugin/require-access-modifier',
//     message: "❌ Methods should have an explicit access modifier (public, private, protected).",
//     hint: 'Add a public, private, or protected modifier to the method.',
//     ...
//   }
// ]
```

Add it to `deno.jsonc`:

```jsonc
{
  "lint": {
    "plugins": ["jsr:@zanix/utils@[version]/linter/deno-std-plugin"]
  }
}
```

## `deno-test-plugin`

Rules that guard against leftover test-debugging helpers. Source:
`src/modules/linter/plugins/test/mod.ts`.

| Rule name   | What it checks                    | Example message                       |
| ----------- | --------------------------------- | ------------------------------------- |
| `no-only`   | Usage of `Deno.test.only(...)`.   | `❌ Deno.test.only is not allowed.`   |
| `no-ignore` | Usage of `Deno.test.ignore(...)`. | `❌ Deno.test.ignore is not allowed.` |

Real diagnostic captured with `Deno.lint.runPlugin`:

```typescript
import testPlugin from 'jsr:@zanix/utils@[version]/linter/deno-test-plugin'

Deno.lint.runPlugin(testPlugin, 'test.ts', `Deno.test.only('test', () => {})`)
// [{
//   id: 'deno-test-plugin/no-only',
//   message: "❌ Deno.test.only is not allowed.",
//   hint: 'Please remove no only condition.',
//   range: [0, 32],
//   fix: []
// }]
```

Add it to `deno.jsonc`:

```jsonc
{
  "lint": {
    "plugins": ["jsr:@zanix/utils@[version]/linter/deno-test-plugin"]
  }
}
```

## `deno-zanix-plugin`

Rules specific to the Zanix Framework, plus every rule from the three plugins
above. Source: `src/modules/linter/plugins/zanix/mod.ts`.

| Rule name                       | What it checks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Example message                                                                                                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-znx-console`                | Any call on the global `console` object (e.g. `console.log`, `console.error`) instead of the Zanix logger. `console.log`/`console.info`/`console.warn`/`console.error` are auto-fixable via `deno lint --fix` (see below); any other `console.*` method is report-only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `❌ Disallows the use of 'console'.`                                                                                                                                                                |
| `no-explicit-znx-imports`       | Imports from an `@zanix` scoped package that include an explicit file extension (e.g. `.ts`, `.js`), instead of importing the package by name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `❌ Explicit imports from '@zanix' modules with file extensions are not allowed. Use the package imports instead.`                                                                                  |
| `use-znx-flags`                 | A bare string-literal expression statement as the very first statement of a file (the same grammar slot as `'use strict'`) whose value isn't one of the known `ZNX_FLAGS` (e.g. `'use comet'`). A string literal anywhere else in the file is ignored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `❌ The flag "otherFlag" is invalid.`                                                                                                                                                               |
| `no-invalid-znx-cookie-name`    | A LITERAL string `cookieName` passed to one of `@zanix/space`'s `csrfGuard`/`langGuard`/`langPreHandler`/`populationGuard` guards (confirmed, in the same file, to be a named import from `@zanix/space` — an unrelated same-named local function is never flagged) that doesn't start with `X-Znx-`, or — for `csrfGuard` specifically — starts with `X-Znx-` but doesn't contain `Csrf` (case-insensitive). A dynamically-computed `cookieName` (a variable, template, or call) can't be evaluated at lint time and is always skipped — that's `assertZnxCookieName`'s (runtime) job instead.                                                                                                                                                                                                                                                                                               | `❌ Cookie name "session" for 'csrfGuard' must start with "X-Znx-".`                                                                                                                                |
| `no-unexported-comet-component` | A component passed as the first argument to `@zanix/space/comet`'s `defineComet` (confirmed, in the same file, to be a named import from `@zanix/space/comet`) that's a NAMED `function`/`const` declared in the same file but never `export`ed (directly or via a later `export { X }`). `defineComet` reads `Component.name` at runtime and the client later does `module[exportName]` after a dynamic import — an unexported named component passes `deno check`/plain `deno lint` today and only fails client-side, at hydration, with `Element type is invalid: expected a string... but got: undefined`. Auto-fixable via `deno lint --fix` (inserts `export` before the declaration). Only flags a plain `Identifier` first argument resolving to a top-level declaration in the same file — an inline function expression or an identifier imported from elsewhere is always skipped. | `❌ Comet component "Counter" is declared but not exported — defineComet reads Component.name at runtime, and the client looks it up as a named export of this same module after a dynamic import.` |

Real diagnostic captured with `Deno.lint.runPlugin`:

```typescript
import zanixPlugin from 'jsr:@zanix/utils@[version]/linter/deno-zanix-plugin'

Deno.lint.runPlugin(zanixPlugin, 'test.ts', `console.log('hi')`)
// [{
//   id: 'deno-zanix-plugin/no-znx-console',
//   message: "❌ Disallows the use of 'console'.",
//   hint: "Please use the Zanix 'logger' module instead for consistent and properly formatted logging.",
//   range: [0, 17],
//   fix: []
// }]
```

### `no-znx-console` auto-fix

`console.log`, `console.info`, `console.warn`, and `console.error` map 1:1
onto `logger.debug`, `logger.info`, `logger.warn`, and `logger.error` — running
`deno lint --fix` rewrites each call site and inserts the `logger` import for
you:

```typescript
// before
console.log('starting', { step: 1 })
console.error('failed', err)

// after `deno lint --fix`
import logger from '@zanix/logger'

logger.debug('starting', { step: 1 })
logger.error('failed', err)
```

The fix resolves the real import alias from the linted file's own project
`deno.json(c)` — walking up from the file's directory for the alias whose
target resolves to `@zanix/utils`'s `/logger` subpath (`@zanix/logger` in
most repos, `@zanix/utils/logger` in `space-ui` — never a single hardcoded
alias). A file with several `console.*` calls only gets the import inserted
once, and a file that already imports the logger (under any name) has that
import reused instead of a second one being added. When the project doesn't
declare `@zanix/utils`'s `/logger` subpath as a dependency at all, the
violation is still reported but `--fix` leaves the file untouched. Any
`console.*` method without a safe 1:1 `logger` mapping (`console.table`,
`console.trace`, ...) is always report-only.

`use-znx-flags` in action — a known flag (`'use comet'`, from the `ZNX_FLAGS`
constant) as the file's first statement passes; anything else in that position
doesn't:

```typescript
import zanixPlugin from 'jsr:@zanix/utils@[version]/linter/deno-zanix-plugin'

Deno.lint.runPlugin(zanixPlugin, 'test.ts', `'otherFlag'`)
// [{
//   id: 'deno-zanix-plugin/use-znx-flags',
//   message: '❌ The flag "otherFlag" is invalid.',
//   hint: 'Review available flags:\n use comet, server-only',
//   range: [0, 11],
//   fix: []
// }]

Deno.lint.runPlugin(
  zanixPlugin,
  'test.ts',
  `'use comet'\nexport function Counter() {}`,
)
// [] — 'use comet' is a known flag
```

Add it to `deno.jsonc`:

```jsonc
{
  "lint": {
    "plugins": ["jsr:@zanix/utils@[version]/linter/deno-zanix-plugin"]
  }
}
```

### `no-invalid-znx-cookie-name` in action

Only flags a call confirmed, in the same file, to be a named import from
`@zanix/space` — this is the lint-time, earlier-feedback counterpart to
`assertZnxCookieName` (see [Helpers](./helpers.md)), for the common case of a
literal `cookieName`:

```typescript
import zanixPlugin from 'jsr:@zanix/utils@[version]/linter/deno-zanix-plugin'

Deno.lint.runPlugin(
  zanixPlugin,
  'test.ts',
  `import { csrfGuard } from '@zanix/space'\ncsrfGuard({ cookieName: 'session' })`,
)
// [{
//   id: 'deno-zanix-plugin/no-invalid-znx-cookie-name',
//   message: '❌ Cookie name "session" for \'csrfGuard\' must start with "X-Znx-".',
//   hint: '@zanix/server\'s cookiesGuard silently drops any cookie outside the "X-Znx-" prefix from ctx.cookies before any guard/handler runs — rename it to e.g. "X-Znx-session".',
//   range: [65, 74],
//   fix: []
// }]

Deno.lint.runPlugin(
  zanixPlugin,
  'test.ts',
  `import { csrfGuard } from '@zanix/space'\ncsrfGuard({ cookieName: 'X-Znx-Token' })`,
)
// [{
//   id: 'deno-zanix-plugin/no-invalid-znx-cookie-name',
//   message: '❌ Cookie name "X-Znx-Token" for \'csrfGuard\' must contain "Csrf" (case-insensitive).',
//   ...
// }]

Deno.lint.runPlugin(
  zanixPlugin,
  'test.ts',
  `import { csrfGuard } from '@zanix/space'\nconst n = 'session'\ncsrfGuard({ cookieName: n })`,
)
// [] — a dynamically-computed value can't be evaluated at lint time

Deno.lint.runPlugin(
  zanixPlugin,
  'test.ts',
  `function csrfGuard(o) { return o }\ncsrfGuard({ cookieName: 'session' })`,
)
// [] — not actually imported from '@zanix/space', just a same-named local function
```

Add it to `deno.jsonc`:

```jsonc
{
  "lint": {
    "plugins": ["jsr:@zanix/utils@[version]/linter/deno-zanix-plugin"]
  }
}
```

### `no-unexported-comet-component` in action

Only flags a call confirmed, in the same file, to resolve to a real `defineComet` import from
`@zanix/space/comet`, and only when the first argument is a plain `Identifier` resolving to a
top-level `function`/`const` declared in that same file:

```typescript
import zanixPlugin from 'jsr:@zanix/utils@[version]/linter/deno-zanix-plugin'

Deno.lint.runPlugin(
  zanixPlugin,
  'test.tsx',
  `import { defineComet } from '@zanix/space/comet'
function Counter() { return null }
export default defineComet(Counter, import.meta.url)`,
)
// [{
//   id: 'deno-zanix-plugin/no-unexported-comet-component',
//   message: '❌ Comet component "Counter" is declared but not exported — defineComet reads Component.name at runtime, and the client looks it up as a named export of this same module after a dynamic import.',
//   hint: 'Add "export" to its declaration (e.g. "export function Counter(...) {}") — an unexported named component compiles and lints cleanly today, then crashes client-side at hydration with "Element type is invalid: expected a string... but got: undefined".',
//   ...
// }]

Deno.lint.runPlugin(
  zanixPlugin,
  'test.tsx',
  `import { defineComet } from '@zanix/space/comet'
export function Counter() { return null }
export default defineComet(Counter, import.meta.url)`,
)
// [] — already exported
```

`deno lint --fix` inserts `export` immediately before the matched declaration:

```typescript
// before
import { defineComet } from '@zanix/space/comet'
function Counter() {
  return null
}
export default defineComet(Counter, import.meta.url)

// after `deno lint --fix`
import { defineComet } from '@zanix/space/comet'
export function Counter() {
  return null
}
export default defineComet(Counter, import.meta.url)
```

Add it to `deno.jsonc`:

```jsonc
{
  "lint": {
    "plugins": ["jsr:@zanix/utils@[version]/linter/deno-zanix-plugin"]
  }
}
```

## Combined plugin

`deno-zanix-plugin` is not just `no-znx-console`, `no-explicit-znx-imports`,
`use-znx-flags`, `no-invalid-znx-cookie-name`, and `no-unexported-comet-component`
— its `mod.ts` spreads the rule sets of `deno-fmt-plugin`, `deno-std-plugin`,
and `deno-test-plugin` into its own `rules` object, then adds its own five
rules on top. In other words, enabling `deno-zanix-plugin` alone gives every
rule documented above (`single-quote`, `line-width`, `no-require`,
`no-useless-expression`, `require-access-modifier`, `no-only`, `no-ignore`,
`no-znx-console`, `no-explicit-znx-imports`, `use-znx-flags`,
`no-invalid-znx-cookie-name`, `no-unexported-comet-component`) in a single
plugin entry, without having to list the other three subpaths individually in
`deno.jsonc`.

Diagnostics reported through the combined plugin still carry `deno-zanix-plugin`
as the `id` prefix (e.g. `deno-zanix-plugin/single-quote`), not the id of the
original sub-plugin, since the rule is registered under the `deno-zanix-plugin`
name.

## See also

- [README](../README.md) — package overview, installation, and the full list of
  subpath exports.
- [Utils](./utils.md#constants) — `ZNX_FLAGS`, the list of flags `use-znx-flags`
  accepts.
- [Helpers](./helpers.md) — `assertZnxCookieName`, the runtime counterpart to
  `no-invalid-znx-cookie-name` for the cases the lint rule can't evaluate
  (a dynamically-computed `cookieName`).
