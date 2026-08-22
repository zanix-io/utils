import { assert, assertEquals, assertExists, assertThrows } from '@std/assert'
import { join } from '@std/path/join'
import { resolve } from '@std/path/resolve'
import { stub } from '@std/testing/mock'
import { ApplicationError } from 'modules/errors/main.ts'
import {
  confinePath,
  getConfigDir,
  getFolderName,
  getPathFromCurrent,
  getRelativePath,
  getRootDir,
  getTemporaryFolder,
} from 'modules/helpers/paths.ts'
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
Deno.test('get config dir should return correct config filedir', () => {
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

Deno.test('getConfigDir prefers a real deno.json file over deno.jsonc', async () => {
  const tempDir = getTemporaryFolder(import.meta.url) + '/json-config'
  await Deno.mkdir(tempDir, { recursive: true })
  await Deno.writeTextFile(join(tempDir, 'deno.json'), '{}')

  assertEquals(getConfigDir(tempDir), join(tempDir, 'deno.json'))

  await Deno.remove(tempDir, { recursive: true })
})

Deno.test('getConfigDir returns null when no real config file exists', async () => {
  const tempDir = getTemporaryFolder(import.meta.url) + '/no-config'
  await Deno.mkdir(tempDir, { recursive: true })

  assertEquals(getConfigDir(tempDir), null)

  await Deno.remove(tempDir, { recursive: true })
})

Deno.test(
  'getTemporaryFolder: with no `unique` arg, returns the SAME fixed __tmp__ path on every call',
  () => {
    const first = getTemporaryFolder(import.meta.url)
    const second = getTemporaryFolder(import.meta.url)

    assertEquals(first, second)
    assert(first.endsWith('__tmp__'), first)
  },
)

Deno.test(
  'getTemporaryFolder: `unique: true` returns a FRESH, real subfolder of __tmp__ each call, ' +
    'with no prefix',
  () => {
    const base = getTemporaryFolder(import.meta.url)
    const first = getTemporaryFolder(import.meta.url, true)
    const second = getTemporaryFolder(import.meta.url, true)

    try {
      assert(first !== second, 'two calls must not return the same folder')
      assert(first.startsWith(base + '/'), first)
      assert(second.startsWith(base + '/'), second)
      // Both real, existing directories on disk — not just computed strings.
      assert(Deno.statSync(first).isDirectory)
      assert(Deno.statSync(second).isDirectory)
    } finally {
      Deno.removeSync(first, { recursive: true })
      Deno.removeSync(second, { recursive: true })
    }
  },
)

Deno.test(
  "getTemporaryFolder: a string `unique` sets the fresh subfolder's own name prefix",
  () => {
    const folder = getTemporaryFolder(import.meta.url, 'fixture-')

    try {
      assert(getFolderName(folder).startsWith('fixture-'), folder)
    } finally {
      Deno.removeSync(folder, { recursive: true })
    }
  },
)

Deno.test('getFolderName should return the folder name from a URI', () => {
  assertEquals(getFolderName('/home/user/project/paths.ts'), 'paths.ts')
  assertEquals(
    getFolderName('/user/project/another-folder/'),
    'another-folder',
  )
})

Deno.test('getPathFromCurrent should return a path relative to the executing script', () => {
  assert(getPathFromCurrent(import.meta.url, 'test.ts').startsWith(Deno.cwd()))
  assert(
    getPathFromCurrent(import.meta.url, './script/test.ts').endsWith(
      '/script/test.ts',
    ),
  )
  assert(getPathFromCurrent(import.meta.url, '') !== import.meta.url)

  assertExists(
    getPathFromCurrent(
      'https://jsr.io/@zanix/utils/1.1.0/src/modules/helpers/github/hooks/scripts/pre-commit.base.sh',
      '',
    ),
  )
})

Deno.test('confinePath resolves an ordinary nested key inside rootDir', () => {
  const root = '/data/objects'
  assertEquals(confinePath(root, 'assets/1/original'), resolve(root, 'assets/1/original'))
})

Deno.test('confinePath blocks a key that traverses above rootDir', () => {
  const error = assertThrows(
    () => confinePath('/data/objects', '../../etc/passwd'),
    ApplicationError,
  )
  assertEquals(error.code, 'UTILS_PATHS_TRAVERSAL_BLOCKED')
  assertThrows(() => confinePath('/data/objects', 'assets/../../etc/passwd'), ApplicationError)
})

Deno.test('confinePath blocks an absolute key, not just a relative traversal', () => {
  // Resolving an absolute key against rootDir overrides rootDir entirely rather than nesting
  // under it — this is the exact same containment escape as `../`, just spelled differently.
  assertThrows(() => confinePath('/data/objects', '/etc/passwd'), ApplicationError)
})

Deno.test('confinePath blocks a key that resolves to rootDir itself', () => {
  assertThrows(() => confinePath('/data/objects', '.'), ApplicationError)
  assertThrows(() => confinePath('/data/objects', ''), ApplicationError)
})

Deno.test('confinePath blocks a sibling dir that merely shares rootDir as a string prefix', () => {
  // A real containment check compares path SEGMENTS, not raw string prefixes — "/data/objects2"
  // must never be treated as inside "/data/objects" just because the string starts the same way.
  assertThrows(() => confinePath('/data/objects', '../objects2/x'), ApplicationError)
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
