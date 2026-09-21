import { assert, assertEquals } from '@std/assert'

/**
 * `utils/urls.ts` is the `./urls` entry a browser bundle imports for the URL helpers. It has to
 * stay small and free of server-only code whatever a bundler tree-shakes, so its import closure is
 * checked at the source: it reaches only `utils/regex.ts`, imports no package or remote specifier,
 * and no file in the closure touches `Deno`.
 */

const SRC = new URL('../../../', import.meta.url)
const LOCAL_ALIASES = ['utils/', 'modules/', 'typings/', 'shared/']
const IMPORT_SPECIFIER = /^\s*(?:import|export)\b[^'"]*?from\s+['"]([^'"]+)['"]/gm

async function importClosure(entry: string) {
  const local = new Map<string, string>()
  const external = new Set<string>()
  const queue = [entry]
  while (queue.length > 0) {
    const specifier = queue.pop() as string
    if (local.has(specifier)) continue
    // deno-lint-ignore no-await-in-loop
    const source = await Deno.readTextFile(new URL(specifier, SRC))
    local.set(specifier, source)
    for (const [, imported] of source.matchAll(IMPORT_SPECIFIER)) {
      if (LOCAL_ALIASES.some((alias) => imported.startsWith(alias))) queue.push(imported)
      else external.add(imported)
    }
  }
  return { local, external }
}

Deno.test('utils/urls.ts reaches only utils/regex.ts and imports no package or remote module', async () => {
  const { local, external } = await importClosure('utils/urls.ts')

  assertEquals([...local.keys()].sort(), ['utils/regex.ts', 'utils/urls.ts'])
  assertEquals([...external], [])
})

Deno.test('utils/urls.ts and everything it imports stay free of Deno APIs', async () => {
  const { local } = await importClosure('utils/urls.ts')

  for (const [specifier, source] of local) {
    assert(!/\bDeno\b/.test(source), `${specifier} references Deno`)
  }
})
