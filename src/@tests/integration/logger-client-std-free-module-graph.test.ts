import { assert, assertFalse } from '@std/assert'
import { fromFileUrl } from '@std/path'

import { includesSpecifier, resolveOnlyCodeEdges } from './__fixtures__/deno-info-graph.ts'

// Coverage for `createClientLogger`'s browser-bundlability: via `deno info`'s own real module
// graph for `@zanix/logger/client`'s entrypoint (`modules/logger/main.ts`, the module
// `createClientLogger` is exported from), this confirms that neither `@std/fmt/colors` nor
// `@std/path` is reachable through a REAL (runtime/"code") import edge —
// (`registerColorFormatter`/`registerConfigNameReader` in `modules/logger/base.ts` keep both
// specifiers statically imported only from `modules/logger/mod.ts`, the SERVER barrel, never from
// this graph). The only edge either specifier can appear on here is a "type" edge (`base.ts`'s own
// `typeof import('@std/fmt/colors')` type query), which a bundler transpiling TypeScript (Vite,
// esbuild) elides entirely before it ever tries to resolve a specifier, unlike a real
// value-level `import` statement. See `./__fixtures__/deno-info-graph.ts` for the shared BFS
// this test (and `helpers-cron-masking-worker-free-module-graph.test.ts`) build on.

Deno.test(
  "createClientLogger's own module graph (main.ts) never reaches @std/fmt/colors or @std/path through a real import",
  async () => {
    const mainTs = fromFileUrl(
      new URL('../../modules/logger/main.ts', import.meta.url),
    )
    const reachable = await resolveOnlyCodeEdges(mainTs)

    assertFalse(
      includesSpecifier(reachable, '@std/fmt'),
      "@std/fmt (colors) leaked into createClientLogger's real (code) module graph",
    )
    assertFalse(
      includesSpecifier(reachable, '@std/path'),
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
      includesSpecifier(reachable, '@std/fmt'),
      'expected the server Logger to still really import @std/fmt (colors)',
    )
    assert(
      includesSpecifier(reachable, '@std/path'),
      'expected the server Logger to still really import @std/path (via readConfig)',
    )
  },
)
