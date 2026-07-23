import { assertEquals } from '@std/assert'
import { stub } from '@std/testing/mock'
import { readModuleConfig } from 'modules/helpers/config.ts'

Deno.test('readModuleConfig should read a valid JSON config file', async () => {
  const config = await readModuleConfig(import.meta.url)

  assertEquals(config.zanix?.project, 'library') // This project must be a library
  assertEquals(config.name, '@zanix/utils')
})

Deno.test('readModuleConfig should read a valid JSON config file from jsr', async () => {
  const config = await readModuleConfig('https://jsr.io/@zanix/utils/2.0.5/src/templates/mod.ts')

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
    const config = await readModuleConfig('https://jsr.io/@zanix/utils/2.0.5/src/templates/mod.ts')
    assertEquals(config, {})
  } finally {
    fetchStub.restore()
  }
})
