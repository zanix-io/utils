import { assertEquals } from '@std/assert'

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
 * transpiling TypeScript never even sees. Returns the full set of specifiers reachable that way,
 * both as originally written (e.g. `@std/fmt/colors`) and as resolved (e.g.
 * `jsr:/@std/fmt@0.224/colors`, `https://jsr.io/@std/fmt/0.224.0/colors.ts`) — so a caller can
 * match against whichever form is convenient.
 *
 * Shared by every "does this file's own module graph leak a server/Worker-only dependency into a
 * browser-bundlable entrypoint" test — extracted from
 * `logger-client-std-free-module-graph.test.ts`'s own original inline copy so a second such test
 * (e.g. one covering `utils/cron.ts`/`helpers/masking/hard.ts`'s own leaner graph) doesn't need to
 * duplicate this BFS logic.
 *
 * `deno info --json` deliberately walks BOTH "type" and "code" dependency edges (it needs to, for
 * `deno check`) — so simply checking whether a specifier appears ANYWHERE in the graph wouldn't
 * distinguish a genuinely code-reachable specifier from a merely type-reachable one. Each
 * dependency in `deno info`'s own JSON output is tagged with either a `"code"` field (a real
 * runtime import a bundler must resolve) or a `"type"` field (type-only, always erased) — the one
 * line below that matters is following only `dep.code`.
 */
export async function resolveOnlyCodeEdges(entrypoint: string): Promise<Set<string>> {
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

/** Whether any specifier in `reachable` (see {@linkcode resolveOnlyCodeEdges}) contains `needle`. */
export const includesSpecifier = (reachable: Set<string>, needle: string): boolean =>
  [...reachable].some((specifier) => specifier.includes(needle))
