import { assert, assertEquals, assertFalse } from '@std/assert'
import { fromFileUrl } from '@std/path'

// Coverage for `createClientLogger`'s browser-bundlability: via `deno info`'s own real module
// graph for `@zanix/logger/client`'s entrypoint (`modules/logger/main.ts`, the module
// `createClientLogger` is exported from), this confirms that neither `@std/fmt/colors` nor
// `@std/path` is reachable through a REAL (runtime/"code") import edge —
// (`registerColorFormatter`/`registerConfigNameReader` in `modules/logger/base.ts` keep both
// specifiers statically imported only from `modules/logger/mod.ts`, the SERVER barrel, never from
// this graph). The only edge either specifier can appear on here is a "type" edge (`base.ts`'s own
// `typeof import('@std/fmt/colors')` type query), which a bundler transpiling TypeScript (Vite,
// esbuild) elides entirely before it ever tries to resolve a specifier, unlike a real
// value-level `import` statement.
//
// `deno info --json` deliberately walks BOTH "type" and "code" dependency edges (it needs to, for
// `deno check`) — so simply checking whether either specifier appears ANYWHERE in the graph
// wouldn't distinguish a genuinely code-reachable specifier from a merely type-reachable one. Each
// dependency in `deno info`'s own JSON output is tagged with either a `"code"` field (a real
// runtime import a bundler must resolve) or a `"type"` field (type-only, always erased) — see
// `resolveOnlyCodeEdges`'s own doc below for how this test tells them apart, the actual
// distinction that matters for a browser bundler.

interface DenoInfoDependency {
  specifier: string
  code?: { specifier: string }
  type?: { specifier: string }
}

interface DenoInfoModule {
  specifier: string
  dependencies?: DenoInfoDependency[]
}

interface DenoInfoOutput {
  roots: string[]
  modules: DenoInfoModule[]
}

/**
 * Runs `deno info --json` on `entrypoint` and BFS-walks only the "code" (real, runtime) edges of
 * its own module graph, starting from its own root — never a "type"-only edge, which a bundler
 * transpiling TypeScript never even sees (see this file's own top-of-file doc for why that
 * distinction is the whole point of this test). Returns the full set of specifiers reachable that
 * way, both as originally written (e.g. `@std/fmt/colors`) and as resolved (e.g.
 * `jsr:/@std/fmt@0.224/colors`, `https://jsr.io/@std/fmt/0.224.0/colors.ts`) — so a caller can
 * match against whichever form is convenient.
 */
async function resolveOnlyCodeEdges(entrypoint: string): Promise<Set<string>> {
  const { code, stdout, stderr } = await new Deno.Command('deno', {
    args: ['info', '--json', entrypoint],
  }).output()

  const stderrText = new TextDecoder().decode(stderr)
  assertEquals(code, 0, `expected 'deno info' to exit 0, got ${code}. stderr:\n${stderrText}`)

  const graph = JSON.parse(new TextDecoder().decode(stdout)) as DenoInfoOutput
  const moduleBySpecifier = new Map(graph.modules.map((mod) => [mod.specifier, mod]))

  // Two sets, deliberately not one: `visited` gates which nodes' own dependencies still need
  // expanding (a node reached via `dep.code.specifier` below must still have ITS OWN dependencies
  // walked later, so it can't be marked "done" the moment it's discovered — only once actually
  // dequeued and processed); `reachable` is purely the reporting set of every specifier string
  // seen along a real "code" edge, which does grow the moment each one is discovered.
  const reachable = new Set<string>(graph.roots)
  const visited = new Set<string>()
  const queue = [...graph.roots]

  while (queue.length) {
    const current = queue.shift() as string
    if (visited.has(current)) continue
    visited.add(current)

    for (const dep of moduleBySpecifier.get(current)?.dependencies ?? []) {
      // The one line that matters: only follow `dep.code` (a real runtime import) — never
      // `dep.type` (type-only, always erased before a bundler ever resolves anything).
      if (!dep.code) continue

      reachable.add(dep.specifier)
      reachable.add(dep.code.specifier)
      if (!visited.has(dep.code.specifier)) queue.push(dep.code.specifier)
    }
  }

  return reachable
}

const includesStd = (reachable: Set<string>, pkg: 'path' | 'fmt') =>
  [...reachable].some((specifier) => specifier.includes(`@std/${pkg}`))

Deno.test(
  "createClientLogger's own module graph (main.ts) never reaches @std/fmt/colors or @std/path through a real import",
  async () => {
    const mainTs = fromFileUrl(
      new URL('../../modules/logger/main.ts', import.meta.url),
    )
    const reachable = await resolveOnlyCodeEdges(mainTs)

    assertFalse(
      includesStd(reachable, 'fmt'),
      "@std/fmt (colors) leaked into createClientLogger's real (code) module graph",
    )
    assertFalse(
      includesStd(reachable, 'path'),
      "@std/path leaked into createClientLogger's real (code) module graph",
    )
  },
)

Deno.test(
  'the server Logger barrel (mod.ts) still really imports @std/fmt/colors and @std/path (proves the check above is meaningful, not vacuous)',
  async () => {
    const modTs = fromFileUrl(
      new URL('../../modules/logger/mod.ts', import.meta.url),
    )
    const reachable = await resolveOnlyCodeEdges(modTs)

    assert(
      includesStd(reachable, 'fmt'),
      'expected the server Logger to still really import @std/fmt (colors)',
    )
    assert(
      includesStd(reachable, 'path'),
      'expected the server Logger to still really import @std/path (via readConfig)',
    )
  },
)
