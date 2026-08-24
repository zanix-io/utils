import { assertEquals, assertStringIncludes } from '@std/assert'
import { fromFileUrl } from '@std/path'

// Regression coverage for https://github.com/zanix-io/utils/issues/10 — see the fixture's own
// doc for the full import-chain explanation. Run in a real fresh-process module graph (a
// subprocess, the same style used by `logger-lazy-config.test.ts` and
// `errors-logger-log-sink-fresh-module-graph.test.ts` for the same class of eager-side-effect
// bug), since the bug only manifests once `self`/`globalThis` in a real, separate process gets its
// own `unhandledrejection` listener installed — the shared test-runner process can't distinguish
// this from every other test's own module graph.
Deno.test(
  "importing @zanix/helpers never suppresses the host process's own unhandled promise rejections",
  async () => {
    const fixture = fromFileUrl(
      new URL('./__fixtures__/import-helpers-unhandled-rejection.ts', import.meta.url),
    )

    const { code, stderr } = await new Deno.Command('deno', {
      args: ['run', '-A', fixture],
    }).output()

    const stderrText = new TextDecoder().decode(stderr)

    assertEquals(
      code === 0,
      false,
      `expected a non-zero exit code (the unhandled rejection should crash the process), got 0. stderr:\n${stderrText}`,
    )
    assertStringIncludes(stderrText, 'boom')
  },
)
