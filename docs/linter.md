# Linter plugins

`@zanix/utils` ships four [`Deno.lint`](https://deno.com/) plugins as independent subpath exports, so a consumer can pull in only the rules it needs instead of the whole package. Each plugin is a plain `Deno.lint.Plugin` object (`{ name, rules }`) and can be dropped straight into the `"lint": { "plugins": [...] }` array of a `deno.json`/`deno.jsonc` file:

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

Every diagnostic reported by these plugins uses the same message format: a leading `❌` followed by the human-readable description (see `linterMessageFormat` in `src/modules/linter/commons/message.ts`). The diagnostic `id` is always `<plugin-name>/<rule-name>`, for example `deno-fmt-plugin/single-quote`.

The plugins can also be imported directly and run programmatically through `Deno.lint.runPlugin(plugin, fileName, code)`:

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

| Rule name      | What it checks                                                                                                                                        | Example message                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `single-quote` | String literals enclosed in double quotes instead of single quotes.                                                                                   | `❌ Use single quotes instead of double quotes.`                   |
| `line-width`   | Lines that exceed the maximum allowed width (100 characters), with exceptions for `import` lines, comments, and a few other cases handled internally. | `❌ The line exceeds the maximum allowed width of 100 characters.` |

Real diagnostic captured with `Deno.lint.runPlugin`:

```typescript
import formatPlugin from 'jsr:@zanix/utils@[version]/linter/deno-fmt-plugin'

Deno.lint.runPlugin(formatPlugin, 'test.ts', `const a = "This is double quoted";`)
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

General-purpose standard rules for Deno/TypeScript codebases. Source: `src/modules/linter/plugins/standard/mod.ts`. Note that the subpath is `deno-std-plugin`, not `deno-standard-plugin`.

| Rule name                 | What it checks                                                                                                                                                                                                                                           | Example message                                                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-require`              | Usage of the CommonJS `require()` function instead of `import`.                                                                                                                                                                                          | `❌ Don't use require() calls to load modules.`                                                                                                                             |
| `no-useless-expression`   | Expression statements with no effect (a bare `SequenceExpression`, a non-first-position bare `Literal`, an immediately-invoked `FunctionExpression`, a bare `LogicalExpression`, or an `injectGlobal` tagged template).                                  | `❌ Unnecessary expression.`                                                                                                                                                |
| `require-access-modifier` | Class methods or properties without an explicit `public`, `private`, or `protected` modifier (constructors and `#private` members are exempt). Reports one of two distinct messages depending on whether the offending member is a method or a property. | `❌ Methods should have an explicit access modifier (public, private, protected).` or `❌ Properties should have an explicit access modifier (public, private, protected).` |

Real diagnostics captured with `Deno.lint.runPlugin` against a class with an undecorated property and method:

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

Rules that guard against leftover test-debugging helpers. Source: `src/modules/linter/plugins/test/mod.ts`.

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

Rules specific to the Zanix Framework, plus every rule from the three plugins above. Source: `src/modules/linter/plugins/zanix/mod.ts`.

| Rule name                 | What it checks                                                                                                                                 | Example message                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `no-znx-console`          | Any call on the global `console` object (e.g. `console.log`, `console.error`) instead of the Zanix logger.                                     | `❌ Disallows the use of 'console'.`                                                                               |
| `no-explicit-znx-imports` | Imports from an `@zanix` scoped package that include an explicit file extension (e.g. `.ts`, `.js`), instead of importing the package by name. | `❌ Explicit imports from '@zanix' modules with file extensions are not allowed. Use the package imports instead.` |

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

Add it to `deno.jsonc`:

```jsonc
{
  "lint": {
    "plugins": ["jsr:@zanix/utils@[version]/linter/deno-zanix-plugin"]
  }
}
```

## Combined plugin

`deno-zanix-plugin` is not just `no-znx-console` and `no-explicit-znx-imports` — its `mod.ts` spreads the rule sets of `deno-fmt-plugin`, `deno-std-plugin`, and `deno-test-plugin` into its own `rules` object, then adds its own two rules on top. In other words, enabling `deno-zanix-plugin` alone gives every rule documented above (`single-quote`, `line-width`, `no-require`, `no-useless-expression`, `require-access-modifier`, `no-only`, `no-ignore`, `no-znx-console`, `no-explicit-znx-imports`) in a single plugin entry, without having to list the other three subpaths individually in `deno.jsonc`.

Diagnostics reported through the combined plugin still carry `deno-zanix-plugin` as the `id` prefix (e.g. `deno-zanix-plugin/single-quote`), not the id of the original sub-plugin, since the rule is registered under the `deno-zanix-plugin` name.

## See also

- [README](../README.md) — package overview, installation, and the full list of subpath exports.
