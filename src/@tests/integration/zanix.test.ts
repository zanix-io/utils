import { getZanixPaths } from 'modules/helpers/zanix/tree.ts'
import { assert, assertEquals, assertExists } from '@std/assert'
import { ZanixTree } from 'modules/helpers/zanix/base-tree.ts'

Deno.test('getZanixPaths should return correct folder structure for server type', () => {
  const paths = getZanixPaths('server')

  assertExists(paths.subfolders)
  assertExists(paths.subfolders['.dist'])
  assertExists(paths.subfolders.src)
  assertExists(paths.subfolders.src.subfolders.server)
  assert(paths.subfolders.src.subfolders['modules' as never] === undefined)
  assert(paths.subfolders.src.subfolders['app' as never] === undefined)
})

Deno.test('getZanixPaths should return correct folder structure for server type custom dir', () => {
  const paths = getZanixPaths('server', 'my-server')

  assertExists(paths.subfolders.src.subfolders.server)
  assert(paths.subfolders.src.subfolders['modules' as never] === undefined)
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
  assert(paths.subfolders.src.subfolders['modules' as never] === undefined)
  assertExists(paths.subfolders.src.subfolders.shared.subfolders.middlewares)
})

Deno.test('getZanixPaths should return correct folder tree for library type custom dir', () => {
  const paths = getZanixPaths('library', 'my-library')

  assertExists(paths.subfolders.src.subfolders.modules)
  assertEquals(paths.subfolders.src.subfolders.shared.subfolders, {})
  assert(paths.subfolders.src.subfolders['server' as never] === undefined)
  assert(paths.subfolders.src.subfolders['app' as never] === undefined)
})

Deno.test('getZanixPaths should return correct folder tree for all type custom dir', () => {
  const paths = getZanixPaths('all', 'my-project')

  assertExists(paths.subfolders.src.subfolders.modules)
  assertExists(paths.subfolders.src.subfolders.server)
  assertExists(paths.subfolders.src.subfolders.app)
  assertExists(paths.subfolders.src.subfolders.shared.subfolders.middlewares)
})

Deno.test('getZanixPaths should return correct folder tree for project type custom dir', () => {
  const paths = getZanixPaths('app-server', 'my-new-project')

  assertExists(paths.subfolders.src.subfolders.server)
  assertExists(paths.subfolders.src.subfolders.app)
  assertExists(paths.subfolders.src.subfolders.shared.subfolders.middlewares)
  assert(paths.subfolders.src.subfolders['modules' as never] === undefined)
})

Deno.test(
  'getZanixPaths should return correct folder and content tree wihtout root uri',
  async () => {
    const paths = getZanixPaths('library', '')

    const content = await paths.templates.base[0].content({
      metaUrl: import.meta.url,
      relativePath: '../../../',
    })

    assert(content !== '')

    assertEquals(paths.FOLDER, '/')
  },
)

Deno.test(
  'zanix tree content class should return correct content',
  async () => {
    // deno-lint-ignore no-explicit-any
    const tree = ZanixTree.create<any>('', {
      subfolders: {
        src: {
          subfolders: {
            utils: {
              templates: { base: { files: ['example.ts'] } },
            },
            other: {},
          },
        },
      },
    })

    const content = await tree.subfolders.src.subfolders.utils.templates.base[0].content({
      metaUrl: import.meta.url,
      relativePath: '../../templates',
    })

    assert(content !== '')
  },
)
