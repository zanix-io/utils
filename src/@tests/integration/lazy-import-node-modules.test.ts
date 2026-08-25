import { assert, assertEquals, assertStringIncludes } from '@std/assert'
import { fromFileUrl, join } from '@std/path'

// Confirms `lazyFunction`'s central promise against a REAL `npm:` package
// (`left-pad@1.3.0` — tiny, dependency-free, chosen so a real `deno run` here stays fast) under a
// REAL `deno.json` declaring `"nodeModulesDir": "auto"` — the exact setting confirmed (via a
// controlled `zanix space build` experiment, see `lazy-import.ts`'s own module doc) to eagerly
// materialize every npm package a `deno.json` DECLARES in its `imports` map, regardless of
// whether reachable code actually imports it. Since neither fixture here ever adds `left-pad` to
// that map (the specifier is passed straight to `lazyFunction`, never through `imports`), this is
// real proof the lazy-dependency convention works, not just that the eager-materialization bug
// exists.
//
// Two confirmed-real quirks this test's own shape works around, both found while building it —
// neither is theoretical:
//
// 1. `deno run <entry>`'s config (`deno.json`) auto-discovery walks up from the ENTRY SCRIPT's own
//    path, not from `cwd` — confirmed via a controlled repro: an entry file outside `cwd`, with
//    `cwd` pointed at a directory with its own `nodeModulesDir: "auto"` config, silently ignored
//    that config entirely (no error, but no local `node_modules` either — it fell through to
//    Deno's global npm cache instead). Since these fixtures physically live inside THIS repo's own
//    tree (next to this test file, like every other fixture here), `--config` is passed
//    EXPLICITLY, pointing at the temp project's own `deno.json`, so the fixture's own real
//    location can never make Deno resolve the wrong config.
// 2. A fixture `cwd` nested INSIDE `@zanix/utils`'s own tree (`getTemporaryFolder(import.meta.url)`,
//    the pattern `logger-lazy-config.test.ts` otherwise uses) lets Deno's npm resolution find/reuse
//    an EXISTING ancestor `node_modules` (this repo's own root, if one happens to exist from an
//    unrelated local run) instead of creating the nested temp project's own separate one — silently
//    invalidating this test's "materializes ONLY in the fixture project's own node_modules" premise.
//    `Deno.makeTempDir()` (a real OS temp dir, fully outside this repo) avoids that entirely — and
//    is the more faithful shape anyway, since a genuine downstream consumer is never nested inside
//    `@zanix/utils`'s own repo either.
//
// Real subprocesses making a real network call to the npm registry — this test needs network
// access and takes noticeably longer than the rest of this suite; that's expected, not a flake.

async function nodeModulesExists(cwd: string): Promise<boolean> {
  try {
    await Deno.stat(join(cwd, 'node_modules'))
    return true
  } catch {
    return false
  }
}

Deno.test(
  'lazyFunction: building the wrapper alone never materializes the real npm package',
  async () => {
    const fixture = fromFileUrl(
      new URL('./__fixtures__/lazy-import-build-only.ts', import.meta.url),
    )

    const cwd = await Deno.makeTempDir({ prefix: 'znx-lazy-import-build-only-' })
    const configPath = join(cwd, 'deno.json')
    await Deno.writeTextFile(
      configPath,
      JSON.stringify({ name: 'fixture-project', nodeModulesDir: 'auto' }),
    )

    try {
      const { code, stdout, stderr } = await new Deno.Command('deno', {
        args: ['run', '-A', '--config', configPath, fixture],
        cwd,
      }).output()

      const stderrText = new TextDecoder().decode(stderr)
      assertEquals(code, 0, `expected exit code 0, got ${code}. stderr:\n${stderrText}`)
      assertStringIncludes(new TextDecoder().decode(stdout), 'BUILT_WITHOUT_INVOKING')

      assert(
        !(await nodeModulesExists(cwd)),
        'node_modules was created merely by BUILDING the lazyFunction wrapper — it must only ' +
          'materialize once the wrapper is actually invoked.',
      )
    } finally {
      await Deno.remove(cwd, { recursive: true })
    }
  },
)

Deno.test(
  'lazyFunction: invoking the wrapper materializes the real npm package on demand',
  async () => {
    const fixture = fromFileUrl(
      new URL('./__fixtures__/lazy-import-invoke.ts', import.meta.url),
    )

    const cwd = await Deno.makeTempDir({ prefix: 'znx-lazy-import-invoke-' })
    const configPath = join(cwd, 'deno.json')
    await Deno.writeTextFile(
      configPath,
      JSON.stringify({ name: 'fixture-project', nodeModulesDir: 'auto' }),
    )

    try {
      const { code, stdout, stderr } = await new Deno.Command('deno', {
        args: ['run', '-A', '--config', configPath, fixture],
        cwd,
      }).output()

      const stderrText = new TextDecoder().decode(stderr)
      assertEquals(code, 0, `expected exit code 0, got ${code}. stderr:\n${stderrText}`)
      assertStringIncludes(new TextDecoder().decode(stdout), 'INVOKED_RESULT:001')

      assert(
        await nodeModulesExists(cwd),
        'node_modules should exist once the wrapper was actually invoked',
      )

      let leftPadMaterialized = false
      for await (const entry of Deno.readDir(join(cwd, 'node_modules', '.deno'))) {
        if (entry.name.startsWith('left-pad@')) leftPadMaterialized = true
      }
      assert(
        leftPadMaterialized,
        'left-pad should be a real, materialized entry under node_modules/.deno once invoked',
      )
    } finally {
      await Deno.remove(cwd, { recursive: true })
    }
  },
)
