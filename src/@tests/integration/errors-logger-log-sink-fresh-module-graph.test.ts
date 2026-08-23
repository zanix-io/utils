import { assertEquals, assertStringIncludes } from '@std/assert'
import { fromFileUrl } from '@std/path'

// Regression coverage for the errors↔logger import-cycle fix (`registerLogSink`/`logSink` in
// `modules/errors/main.ts`, wired up from `modules/logger/mod.ts`): confirms, in a real fresh
// module graph (a subprocess — see the fixture's own doc for why), that constructing an error
// with `shouldLog: true` neither throws NOR silently fails to log — the two real risks the
// previous direct `import logger from 'modules/logger/mod.ts'` used to make impossible by
// construction, and that the dependency-inversion fix has to preserve without that direct import.
Deno.test(
  'the errors/logger log sink stays connected in a fresh module graph, regardless of import order',
  async () => {
    const fixture = fromFileUrl(
      new URL(
        './__fixtures__/errors-logger-log-sink-fresh-module-graph.ts',
        import.meta.url,
      ),
    )

    const { code, stdout, stderr } = await new Deno.Command('deno', {
      args: ['run', '-A', fixture],
    }).output()

    const stderrText = new TextDecoder().decode(stderr)
    assertEquals(
      code,
      0,
      `expected exit code 0, got ${code}. stderr:\n${stderrText}`,
    )
    assertStringIncludes(new TextDecoder().decode(stdout), 'LOG_SINK_CONNECTED')
  },
)
