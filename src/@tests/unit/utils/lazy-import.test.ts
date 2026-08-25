import { assertEquals, assertStrictEquals } from '@std/assert'
import { lazyClass, lazyFunction, lazyValue } from 'utils/lazy-import.ts'

// Each fixture is resolved as an absolute `file:` URL, never a bare relative specifier —
// `import(specifier)` inside `lazy-import.ts` resolves a relative specifier against THAT module's
// own location (src/utils/), not this test file's, so a bare './__fixtures__/...' string here
// would resolve to the wrong place entirely.
const lazyFunctionFixtureUrl = new URL('./__fixtures__/lazy-function-target.ts', import.meta.url)
  .href
const lazyClassFixtureUrl = new URL('./__fixtures__/lazy-class-target.ts', import.meta.url).href
const lazyValueFixtureUrl = new URL('./__fixtures__/lazy-value-target.ts', import.meta.url).href

const globalScope = globalThis as Record<string, unknown>

Deno.test('lazyFunction: defers import() until the wrapper is invoked', async () => {
  // Checked via a plain globalThis property read — never via `import()`, which would itself BE
  // the side effect under test and falsify this "not yet imported" assertion.
  assertEquals(globalScope.__lazyFunctionFixtureImportCount, undefined)

  const wrapper = lazyFunction<(name: string) => string>(lazyFunctionFixtureUrl, 'greet')
  // Building the wrapper alone must not have touched the module graph yet.
  assertEquals(globalScope.__lazyFunctionFixtureImportCount, undefined)

  const result = await wrapper('World')
  assertEquals(result, 'hello World')
  assertEquals(globalScope.__lazyFunctionFixtureImportCount, 1)
})

Deno.test('lazyFunction: passes through arguments and the real return value', async () => {
  const wrapper = lazyFunction<(name: string) => string>(lazyFunctionFixtureUrl, 'greet')
  assertEquals(await wrapper('Zanix'), 'hello Zanix')
  // Already imported by the previous test — module cache dedup, not a second real import.
  assertEquals(globalScope.__lazyFunctionFixtureImportCount, 1)
})

Deno.test('lazyClass: defers import() until the factory is invoked', async () => {
  type GreeterCtor = new (name: string) => { name: string; greet(): string }

  assertEquals(globalScope.__lazyClassFixtureImportCount, undefined)

  const create = lazyClass<GreeterCtor>(lazyClassFixtureUrl, 'Greeter')
  assertEquals(globalScope.__lazyClassFixtureImportCount, undefined)

  const instance = await create('World')
  assertEquals(globalScope.__lazyClassFixtureImportCount, 1)

  // A real instance of the real class — not a plain object shaped like one.
  const targetModule = await import(lazyClassFixtureUrl)
  assertStrictEquals(Object.getPrototypeOf(instance), targetModule.Greeter.prototype)
  assertEquals(instance.name, 'World')
  assertEquals(instance.greet(), 'hello World')
})

Deno.test('lazyValue: defers import() until the thunk is invoked', async () => {
  assertEquals(globalScope.__lazyValueFixtureImportCount, undefined)

  const getGreeting = lazyValue<string>(lazyValueFixtureUrl, 'GREETING')
  assertEquals(globalScope.__lazyValueFixtureImportCount, undefined)

  assertEquals(await getGreeting(), 'hello')
  assertEquals(globalScope.__lazyValueFixtureImportCount, 1)
})

Deno.test('lazyValue: repeated calls avoid re-importing (module cache dedup)', async () => {
  const getGreeting = lazyValue<string>(lazyValueFixtureUrl, 'GREETING')

  await getGreeting()
  await getGreeting()
  await getGreeting()

  // Deno's own module cache deduplicates repeated import() calls to the same specifier — this
  // helper adds no caching layer of its own, so the side-effect marker still reads 1, not 3.
  assertEquals(globalScope.__lazyValueFixtureImportCount, 1)
})
