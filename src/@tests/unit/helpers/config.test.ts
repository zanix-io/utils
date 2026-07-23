import type { ConfigFile } from 'typings/config.ts'

import { readConfig, saveConfig } from 'modules/helpers/config.ts'
import { assertEquals, assertExists, assertStrictEquals, assertThrows } from '@std/assert'
import { stub } from '@std/testing/mock'
import { mockWrap } from 'modules/testing/mocks.ts'
import { getConfigDir, getTemporaryFolder } from 'modules/helpers/paths.ts'

// Mock `getConfigDir` to return a temporary file
const baseFilePath = getTemporaryFolder(import.meta.url) + '/deno.jsonc'

Deno.test('saveConfig should write a JSON config file', async () => {
  const testConfig: ConfigFile = { version: '1.0.0' }

  await saveConfig(testConfig, baseFilePath)
  const content = await Deno.readTextFile(baseFilePath)

  assertEquals(JSON.parse(content), testConfig)

  await Deno.remove(baseFilePath)
})

Deno.test('saveConfig falls back to the resolved config dir when no path is given', async () => {
  const tempDir = getTemporaryFolder(import.meta.url) + '/save-default'
  await Deno.mkdir(tempDir, { recursive: true })
  await Deno.writeTextFile(tempDir + '/deno.json', '{}') // makes getConfigDir() resolve here
  const cwdStub = stub(Deno, 'cwd', () => tempDir)

  try {
    const testConfig: ConfigFile = { version: '2.0.0' }
    await saveConfig(testConfig)

    const content = await Deno.readTextFile(tempDir + '/deno.json')
    assertEquals(JSON.parse(content), testConfig)
  } finally {
    cwdStub.restore()
    await Deno.remove(tempDir, { recursive: true })
  }
})

Deno.test('readConfig should read a valid JSON config file', () => {
  const config = readConfig()

  assertEquals(config.zanix?.project, 'library') // This project must be a library
  assertEquals(config.name, '@zanix/utils')
})

Deno.test('readConfig should throw an error if file does not exist', () => {
  const readConfigMock = mockWrap(readConfig, {
    getConfigDir: () => baseFilePath,
  })

  assertThrows(readConfigMock)
})

Deno.test('readConfig returns the cached config on a second call with the same path', () => {
  const realConfigPath = getConfigDir()
  assertExists(realConfigPath)

  const first = readConfig(realConfigPath)
  const second = readConfig(realConfigPath)

  assertStrictEquals(second, first)
})

Deno.test('readConfig throws when no config file path can be resolved', async () => {
  const emptyDir = getTemporaryFolder(import.meta.url) + '/empty'
  await Deno.mkdir(emptyDir, { recursive: true })
  const cwdStub = stub(Deno, 'cwd', () => emptyDir)

  try {
    assertThrows(() => readConfig(), Error, 'Configuration file not found')
  } finally {
    cwdStub.restore()
    await Deno.remove(emptyDir, { recursive: true })
  }
})
