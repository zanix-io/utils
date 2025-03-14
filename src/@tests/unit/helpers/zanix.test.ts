import { getSrcDir, getSrcName, getZanixPaths } from 'modules/helpers/zanix/tree.ts'
import { assert, assertEquals, assertExists } from '@std/assert'

Deno.test('getSrcDir should return the correct src directory', () => {
  const srcDir = getSrcDir()

  assertEquals(srcDir, getZanixPaths().subfolders.src.FOLDER)

  const serName = getSrcName()

  assertEquals(serName, getZanixPaths().subfolders.src.NAME)
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

Deno.test('getZanixPaths should return correct folder structure for server type custom dir', () => {
  const paths = getZanixPaths('server', 'my-server')

  assertExists(paths.subfolders.src.subfolders.server)
  assert(paths.subfolders.src.subfolders['library' as never] === undefined)
  assert(paths.subfolders.src.subfolders['app' as never] === undefined)
  assertExists(paths.subfolders.src.subfolders.shared.subfolders.middlewares)
})

Deno.test('getZanixPaths should return correct folder structure for app custom dir', () => {
  const mainFolderName = 'my-app'
  const paths = getZanixPaths('app', 'my-app')

  assertExists(paths.subfolders.src.subfolders.app)
  assert(paths.FOLDER.startsWith(mainFolderName))
  assert(paths.subfolders.zanix.FOLDER.startsWith(mainFolderName))
  assert(paths.subfolders.src.FOLDER.startsWith(mainFolderName))
  assert(paths.subfolders.src.subfolders.app.FOLDER.startsWith(mainFolderName))
  assert(paths.subfolders.src.subfolders['server' as never] === undefined)
  assert(paths.subfolders.src.subfolders['library' as never] === undefined)
  assertExists(paths.subfolders.src.subfolders.shared.subfolders.middlewares)
})

Deno.test('getZanixPaths should return correct folder tree for library type custom dir', () => {
  const paths = getZanixPaths('library', 'my-library')

  assertExists(paths.subfolders.src.subfolders.library)
  assert(paths.subfolders.src.subfolders.shared.subfolders === undefined)
  assert(paths.subfolders.src.subfolders['server' as never] === undefined)
  assert(paths.subfolders.src.subfolders['app' as never] === undefined)
})

Deno.test('getZanixPaths should return correct folder tree for all type custom dir', () => {
  const paths = getZanixPaths('all', 'my-project')

  assertExists(paths.subfolders.src.subfolders.library)
  assertExists(paths.subfolders.src.subfolders.server)
  assertExists(paths.subfolders.src.subfolders.app)
  assertExists(paths.subfolders.src.subfolders.shared.subfolders.middlewares)
})

Deno.test('getZanixPaths should return correct folder tree for project type custom dir', () => {
  const paths = getZanixPaths('app-server', 'my-new-project')

  assertExists(paths.subfolders.src.subfolders.server)
  assertExists(paths.subfolders.src.subfolders.app)
  assertExists(paths.subfolders.src.subfolders.shared.subfolders.middlewares)
  assert(paths.subfolders.src.subfolders['library' as never] === undefined)
})

Deno.test('getZanixPaths should return correct folder tree wihtout root uri', () => {
  const paths = getZanixPaths('library', '')
  assertEquals(paths.FOLDER, '')
  assert(!paths.subfolders.dist.FOLDER.startsWith('/'))
})
