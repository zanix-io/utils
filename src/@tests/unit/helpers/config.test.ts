import type { ConfigFile } from 'typings/config.ts'

import { readConfig, saveConfig } from 'modules/helpers/config.ts'
import { assertEquals, assertThrows } from '@std/assert'
import { mockWrap } from 'modules/testing/mocks.ts'
import { getTemporaryFolder } from 'modules/helpers/paths.ts'

// Mock `getConfigDir` to return a temporary file
const baseFilePath = getTemporaryFolder(import.meta.url) + '/deno.jsonc'

Deno.test('saveConfig should write a JSON config file', async () => {
  const testConfig: ConfigFile = { version: '1.0.0' }
  const writeConfigMock = mockWrap(saveConfig, {
    getConfigDir: () => baseFilePath,
  })

  await writeConfigMock(testConfig)
  const content = await Deno.readTextFile(baseFilePath)

  assertEquals(JSON.parse(content), testConfig)

  await Deno.remove(baseFilePath)
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
