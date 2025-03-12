import { getSrcDir, getSrcName, getZanixPaths } from 'modules/helpers/zanix/folders.ts'
import { ZNX_STRUCT } from 'modules/helpers/zanix/projects/main.ts'
import { assert, assertEquals, assertExists } from '@std/assert'

Deno.test('getSrcDir should return the correct src directory', () => {
  const srcDir = getSrcDir()

  assertEquals(srcDir, ZNX_STRUCT.subfolders.src.FOLDER)

  const serName = getSrcName()

  assertEquals(serName, ZNX_STRUCT.subfolders.src.NAME)
})

Deno.test('getZanixPaths should return correct folder structure for server type', () => {
  const paths = getZanixPaths('server')

  assertExists(paths.subfolders)
  assertExists(paths.subfolders.dist)
  assertExists(paths.subfolders.src)
  assertExists(paths.subfolders.src.subfolders.server)
  assert(paths.subfolders.src.subfolders['library' as never] === undefined)
  assert(paths.subfolders.src.subfolders['app' as never] === undefined)
})

Deno.test('getZanixPaths should return correct folder structure for custom dir', () => {
  const mainFolderName = 'my-app'
  const paths = getZanixPaths('app', 'my-app')

  assert(paths.FOLDER.startsWith(mainFolderName))
  assert(paths.subfolders.zanix.FOLDER.startsWith(mainFolderName))
  assert(paths.subfolders.src.FOLDER.startsWith(mainFolderName))
  assert(paths.subfolders.src.subfolders.app.FOLDER.startsWith(mainFolderName))
})
