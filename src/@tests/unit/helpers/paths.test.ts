import { assert, assertEquals } from '@std/assert'
import { join } from '@std/path/join'
import { stub } from '@std/testing/mock'
import { getConfigDir, getFolderName, getRelativePath, getRootDir } from 'modules/helpers/paths.ts'
import { mockWrap } from 'modules/testing/mod.ts'

// Test for getting root path
Deno.test('get root path should return cwd dir', () => {
  // Deno cwd mock

  const cwd = stub(Deno, 'cwd', () => 'utils')

  const rootDir = getRootDir()
  assert(rootDir === 'utils')

  cwd.restore()
})

// Test for getting config path
Deno.test('get config dir should return correct config filename', () => {
  const root = '/mock/root/dir/'
  // Mocks
  const context = {
    getRootDir: () => root,
    join,
    fileExists: (_: string) => false,
    CONFIG_FILE: 'config.json',
  }

  // result for jsonc
  context.fileExists = (filePath: string) => filePath === `${root}config.json`
  const getConfigDirMockedJSON = mockWrap(getConfigDir, context)
  assert(getConfigDirMockedJSON() === `${root}config.json`)

  // result for json
  context.fileExists = (filePath: string) => filePath === `${root}config.jsonc`
  const getConfigDirMockedJSONC = mockWrap(getConfigDir, context)
  assert(getConfigDirMockedJSONC() === `${root}config.jsonc`)
})

Deno.test('getFolderName should return the folder name from a URI', () => {
  assertEquals(getFolderName('/home/user/project/paths.ts'), 'paths.ts')
  assertEquals(getFolderName('/user/project/another-folder/'), 'another-folder')
})

Deno.test('getRelativePath should return the relative path from root to URI', () => {
  // Mock the root directory and URI to test the relative path calculation
  const mockRootDir = '/home/user/project'

  const cwd = stub(Deno, 'cwd', () => mockRootDir)
  const mockUri = '/home/user/project/subfolder/file.txt'
  const expectedRelativePath = 'subfolder/file.txt' // Expected relative path

  // Use Deno's relative function for comparison
  assertEquals(getRelativePath(mockUri), expectedRelativePath)

  cwd.restore()
})
