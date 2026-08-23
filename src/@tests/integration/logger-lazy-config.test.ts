import { getTemporaryFolder } from 'modules/helpers/paths.ts'
import { assertEquals, assertStringIncludes } from '@std/assert'
import { fromFileUrl, join } from '@std/path'

// Regression coverage for the eager-`readConfig()`-on-import bug: `modules/logger/mod.ts`'s
// default `Logger` instance used to force a synchronous `readConfig()` call the moment anything
// imported the logger (`setGlobalZnx`/`baseSaveData`, both now lazy — see their own docs) — the
// same class of bug `@zanix/asyncmq` already had to fix once for its own eager `readConfig()`
// call (`modules/rabbitmq/provider/setup.ts`'s `project`).
//
// This spawns a real `deno run` subprocess, `cwd`'d at a directory with a REAL `deno.json` (not
// an empty one — a config-less `cwd` makes `readConfig()` throw before ever reaching
// `Deno.readTextFileSync` in either version, which wouldn't distinguish eager from lazy), and the
// fixture itself instruments `Deno.readTextFileSync` to prove whether the read happens AT ALL
// merely by importing.
Deno.test(
  'importing the logger never reads the config file on its own',
  async () => {
    const fixture = fromFileUrl(
      new URL('./__fixtures__/import-logger.ts', import.meta.url),
    )

    const cwd = join(getTemporaryFolder(import.meta.url), 'logger-lazy-config')
    await Deno.mkdir(cwd, { recursive: true })
    await Deno.writeTextFile(join(cwd, 'deno.json'), '{"name": "fixture-project"}')

    try {
      const { code, stdout, stderr } = await new Deno.Command('deno', {
        args: ['run', '-A', fixture],
        cwd,
      }).output()

      const stderrText = new TextDecoder().decode(stderr)
      assertEquals(
        code,
        0,
        `expected exit code 0, got ${code}. stderr:\n${stderrText}`,
      )
      assertStringIncludes(
        new TextDecoder().decode(stdout),
        'READ_TEXT_FILE_SYNC_NOT_CALLED',
      )
    } finally {
      await Deno.remove(cwd, { recursive: true })
    }
  },
)
