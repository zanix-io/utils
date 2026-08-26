// deno-coverage-ignore-file

// Behavior fixture for `lazy-import.test.ts`'s `lazyFunction` coverage: importing this module
// bumps a `globalThis` marker as a detectable side effect, checked via a PLAIN property read —
// never via `import()`, since resolving that import IS the very side effect under test, checking
// it that way would falsify the "not yet imported" assertion it exists to prove. This lets the
// test confirm `lazyFunction` genuinely defers `import()` until its returned wrapper is actually
// invoked, never at wrapper-creation time. Always given an absolute `file:` URL by the test, never
// a bare relative specifier — `import()` inside `lazy-import.ts` resolves a relative specifier
// against THAT module's own location, not the test file's. Never given a static `import` anywhere
// else in this package, which would defeat the fixture's whole purpose.
const globalScope = globalThis as Record<string, unknown>
globalScope.__lazyFunctionFixtureImportCount =
  ((globalScope.__lazyFunctionFixtureImportCount as number | undefined) ?? 0) + 1

export function greet(name: string): string {
  return `hello ${name}`
}
