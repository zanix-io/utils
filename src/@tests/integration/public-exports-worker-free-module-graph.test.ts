import { assert, assertFalse } from '@std/assert'
import { fromFileUrl } from '@std/path'

import { stripComments } from 'utils/encoders.ts'
import { includesSpecifier, resolveOnlyCodeEdges } from './__fixtures__/deno-info-graph.ts'

// Regression coverage for the gap traced in `utils-cron-logger-workerchain-comet-gap.md`:
// `utils/cron.ts` and `helpers/masking/hard.ts` each used to import the FULL `modules/logger/
// mod.ts` barrel for a couple of validation-diagnostic log calls. `mod.ts`'s own top-level
// `registerFileSaveFactory(saveDataFileFunction)` unconditionally pulls in `defaults/storage/
// default.ts`'s `WorkerManager`-backed file save path (`modules/workers/mod.ts`) — reached from
// EVERY consumer of `@zanix/utils/helpers`'s barrel this way, regardless of whether they ever
// configure file-based log storage, and regardless of whether the consumer is server-only or (via
// a Comet) genuinely browser-bundled, where a real `new Worker(new URL(...))` call a bundler can't
// resolve fails the build. Both call sites now import `modules/logger/internal.ts` instead — a
// minimal `Logger` built straight from `main.ts` (the same browser-safe entrypoint
// `createClientLogger` already relies on), never `mod.ts`.
//
// Rather than pinning that fix to the two files that happened to trigger it, this test walks
// EVERY public subpath this package actually publishes (`deno.jsonc`'s own `exports` map, read
// fresh each run — a new export added later is covered automatically, no test edit required) and
// asserts none of them reaches `modules/workers/mod.ts` (`WorkerManager`) or `modules/logger/
// mod.ts` through a real "code" edge — except `./logger` itself, which legitimately does (that's
// what makes file-based logging with an optional worker-offload actually work for a real server
// consumer), and `./workers`, which simply IS `modules/workers/mod.ts`. That's the actual
// guarantee this class of bug needs: not "these two files are fixed" but "nothing published by
// this package, current or future, can reach `WorkerManager`/`mod.ts` by accident."

interface ExportsMap {
  exports?: Record<string, string>
}

async function readExportsMap(): Promise<Record<string, string>> {
  const denoJsoncUrl = new URL('../../../deno.jsonc', import.meta.url)
  const raw = await Deno.readTextFile(denoJsoncUrl)
  const { exports } = JSON.parse(stripComments(raw)) as ExportsMap
  return exports ?? {}
}

interface ExportGraph {
  subpath: string
  relativeEntry: string
  reachable: Set<string>
}

// Memoized (module-level, computed once) — both checks below need the same per-subpath graph, so
// this avoids shelling out to `deno info` twice per entrypoint across the two `Deno.test`s.
// Resolved via `.map`/`Promise.all`, not a `for` loop, so every entrypoint's own `deno info` call
// runs concurrently rather than one at a time.
let exportGraphs: Promise<ExportGraph[]> | undefined

function getExportGraphs(): Promise<ExportGraph[]> {
  exportGraphs ??= readExportsMap().then((exportsMap) =>
    Promise.all(
      Object.entries(exportsMap).map(async ([subpath, relativeEntry]) => {
        const entrypoint = fromFileUrl(
          new URL(`../../../${relativeEntry.replace(/^\.\//, '')}`, import.meta.url),
        )
        return { subpath, relativeEntry, reachable: await resolveOnlyCodeEdges(entrypoint) }
      }),
    )
  )
  return exportGraphs
}

// `./logger` (`modules/logger/mod.ts`) is the one deliberate, documented exception: it's the real
// server barrel `registerFileSaveFactory` wires the `WorkerManager`-backed file save default into,
// on purpose, for every genuine `Logger` consumer. `./workers` (`modules/workers/mod.ts`) isn't an
// exception in the same sense — it simply IS the module being checked for, so it trivially
// "reaches" itself as its own root.
const ALLOWED_TO_REACH_WORKERS = new Set(['./logger', './workers'])
const ALLOWED_TO_REACH_LOGGER_MOD = new Set(['./logger'])

Deno.test(
  'every published subpath, except ./logger and ./workers themselves, never reaches WorkerManager (modules/workers/mod.ts) through a real import',
  async () => {
    const graphs = await getExportGraphs()

    for (const { subpath, relativeEntry, reachable } of graphs) {
      if (ALLOWED_TO_REACH_WORKERS.has(subpath)) continue

      assertFalse(
        includesSpecifier(reachable, 'modules/workers/mod.ts'),
        `"${subpath}" (${relativeEntry}) reaches WorkerManager (modules/workers/mod.ts) through a ` +
          'real import — every published subpath other than ./logger/./workers must stay free of ' +
          'it (a browser bundler like Vite fails to resolve its worker entry otherwise)',
      )
    }
  },
)

Deno.test(
  'every published subpath, except ./logger itself, never reaches the full logger barrel (modules/logger/mod.ts) through a real import',
  async () => {
    const graphs = await getExportGraphs()

    for (const { subpath, relativeEntry, reachable } of graphs) {
      if (ALLOWED_TO_REACH_LOGGER_MOD.has(subpath)) continue

      assertFalse(
        includesSpecifier(reachable, 'modules/logger/mod.ts'),
        `"${subpath}" (${relativeEntry}) reaches the full logger barrel (modules/logger/mod.ts) ` +
          'through a real import — only ./logger itself is allowed to',
      )
    }
  },
)

Deno.test(
  './logger (mod.ts) still really imports WorkerManager (proves the checks above are meaningful, not vacuous)',
  async () => {
    const modTs = fromFileUrl(new URL('../../modules/logger/mod.ts', import.meta.url))
    const reachable = await resolveOnlyCodeEdges(modTs)

    assert(
      includesSpecifier(reachable, 'modules/workers/mod.ts'),
      'expected ./logger to still really import WorkerManager (modules/workers/mod.ts)',
    )
  },
)
