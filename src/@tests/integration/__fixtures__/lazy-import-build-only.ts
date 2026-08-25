// deno-coverage-ignore-file

// Regression/behavior fixture for `lazy-import-node-modules.test.ts`: builds a `lazyFunction`
// wrapper around a REAL, tiny, dependency-free npm package (`left-pad@1.3.0`) but never invokes
// it. Run from a `cwd` with its own real `deno.json` declaring `"nodeModulesDir": "auto"` (the
// same setting that, under a bare `imports`-map alias, was confirmed to eagerly materialize every
// declared npm package regardless of actual usage) — this fixture's whole point is proving that
// passing the specifier directly to `lazyFunction` (never through `imports`) sidesteps that:
// merely building the wrapper must not touch `node_modules` at all. The test itself asserts on
// `node_modules`'s real on-disk state; this fixture only needs to prove it ran successfully.
import { lazyFunction } from '../../../utils/lazy-import.ts'

type LeftPad = (input: string, length: number, char: string) => string

const wrapper = lazyFunction<LeftPad>('npm:left-pad@1.3.0', 'default')
void wrapper // built, deliberately never called

// deno-lint-ignore deno-zanix-plugin/no-znx-console
console.log('BUILT_WITHOUT_INVOKING')
