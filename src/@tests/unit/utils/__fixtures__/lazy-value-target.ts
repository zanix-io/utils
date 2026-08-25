// deno-coverage-ignore-file

// Behavior fixture for `lazy-import.test.ts`'s `lazyValue` coverage — see
// `lazy-function-target.ts` for the shared reasoning (globalThis side-effect marker, checked via
// plain property read; always given an absolute `file:` URL; never statically imported anywhere
// else in this package).
const globalScope = globalThis as Record<string, unknown>
globalScope.__lazyValueFixtureImportCount =
  ((globalScope.__lazyValueFixtureImportCount as number | undefined) ?? 0) + 1

export const GREETING = 'hello'
