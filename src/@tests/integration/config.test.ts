import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert'
import { dirname, fromFileUrl } from '@std/path'
import { stub } from '@std/testing/mock'
import { readModuleConfig } from 'modules/helpers/config.ts'

Deno.test('readModuleConfig should read a valid JSON config file', async () => {
  const config = await readModuleConfig(import.meta.url)

  assertEquals(config.zanix?.project, 'library') // This project must be a library
  assertEquals(config.name, '@zanix/utils')
})

Deno.test('readModuleConfig should read a valid JSON config file from jsr', async () => {
  const config = await readModuleConfig(
    'https://jsr.io/@zanix/utils/2.0.5/src/templates/mod.ts',
  )

  assertEquals(config.zanix?.project, 'library') // This project must be a library
  assertEquals(config.name, '@zanix/utils')
})

Deno.test('readModuleConfig falls back to an empty config on a non-ok fetch response', async () => {
  const fetchStub = stub(
    globalThis,
    'fetch',
    () => Promise.resolve(new Response('', { status: 404 })),
  )

  try {
    const config = await readModuleConfig(
      'https://jsr.io/@zanix/utils/2.0.5/src/templates/mod.ts',
    )
    assertEquals(config, {})
  } finally {
    fetchStub.restore()
  }
})

Deno.test('readModuleConfig resolves relative to metaUrl, never to Deno.cwd()', async () => {
  const cwdMock = stub(Deno, 'cwd', () => '/nonexistent/unrelated/directory')

  try {
    const config = await readModuleConfig(import.meta.url)

    assertEquals(config.name, '@zanix/utils') // found by walking up from this test file, not cwd
  } finally {
    cwdMock.restore()
  }
})

Deno.test('readModuleConfig throws when no config is found walking up from metaUrl', async () => {
  await assertRejects(
    () =>
      readModuleConfig(
        'file:///deno.jsonc-does-not-exist-anywhere-above-here.ts',
      ),
    Deno.errors.NotFound,
  )
})

// Regression coverage for https://github.com/zanix-io/utils/issues/18. This needs a real `deno
// run` subprocess with a deliberately restricted `--allow-read` grant — the shared test runner
// here runs with full permissions and can't reproduce a permission denial.
Deno.test(
  'readModuleConfig propagates a permission error instead of masking it as NotFound',
  async () => {
    const fixture = fromFileUrl(
      new URL('./__fixtures__/read-module-config-permission-denied.ts', import.meta.url),
    )
    const fixtureDir = dirname(fixture)

    const { code, stdout, stderr } = await new Deno.Command('deno', {
      args: ['run', `--allow-read=${fixtureDir}`, fixture],
    }).output()

    const stderrText = new TextDecoder().decode(stderr)
    assertEquals(code, 0, `expected exit code 0, got ${code}. stderr:\n${stderrText}`)
    assertStringIncludes(new TextDecoder().decode(stdout), 'PERMISSION_ERROR:NotCapable')
  },
)
