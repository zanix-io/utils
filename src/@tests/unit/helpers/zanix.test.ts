import { assert, assertEquals, assertExists } from '@std/assert'
import { fromFileUrl } from '@std/path'
import { ZNX_STRUCT } from 'modules/helpers/zanix/folders/mod.ts'
import {
  getSrcDir,
  getSrcName,
  getZanixPaths,
  saveZanixConfig,
} from 'modules/helpers/zanix/projects.ts'
import { stub } from '@std/testing/mock'
import { getTemporaryFolder } from 'modules/helpers/paths.ts'
import { baseZnxConfig } from 'modules/helpers/zanix/config/mod.ts'
import { generateImports, linterBaseRules } from 'modules/helpers/zanix/config/main.ts'

Deno.test('generateImports should create correct import mappings', () => {
  const mockFolders = {
    subfolders: {
      utils: { FOLDER: 'src/utils' },
      components: { FOLDER: 'src/components' },
      zanixText: { FOLDER: fromFileUrl(import.meta.url) },
    },
  }

  const imports = generateImports(mockFolders)

  assertEquals(imports['utils/'], 'src/utils')
  assertEquals(imports['components/'], 'src/components')
  assertEquals(imports['zanix.test.ts/'], 'src/@tests/unit/helpers/zanix.test.ts')
})

Deno.test('baseZnxConfig should return a valid config object for app projects', () => {
  const config = baseZnxConfig('app')
  const dist = ZNX_STRUCT.subfolders.dist.NAME

  assert(config.zanix?.project === 'app')
  assertEquals(config.compilerOptions?.jsx, 'react')
  assert(config.lint?.rules?.tags?.includes('react'))
  assertExists(config.name)
  assertExists(config.compilerOptions)
  assertEquals(config.lint?.exclude?.[0], dist)
  assertEquals(config.fmt?.exclude?.[0], dist)
  assertEquals(config.imports, {
    'app/': 'src/app',
    'shared/': 'src/shared',
    'typings/': 'src/typings',
    'utils/': 'src/utils',
  })
})

Deno.test('baseZnxConfig should return a valid config object for library projects', () => {
  const config = baseZnxConfig('library')
  assert(config.zanix?.project === 'library')

  assertEquals(config.lint?.rules?.tags, ['recommended', 'jsr'])
  assertExists(config.zanix.hash)
  assertEquals(config.imports, {
    'modules/': 'src/modules',
    'shared/': 'src/shared',
    'typings/': 'src/typings',
    'utils/': 'src/utils',
  })
})

Deno.test('baseZnxConfig should return a valid config object for app-server projects', () => {
  const config = baseZnxConfig('app-server')

  assert(config.zanix?.project === 'app-server')
  assertExists(config.zanix.hash)
  assertEquals(config.lint?.rules?.tags, ['recommended', 'jsr', 'react', 'jsx'])
  assertEquals(config.imports, {
    'app/': 'src/app',
    'server/': 'src/server',
    'shared/': 'src/shared',
    'typings/': 'src/typings',
    'utils/': 'src/utils',
  })
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

Deno.test('getSrcDir should return the correct src directory', () => {
  const srcDir = getSrcDir()

  assertEquals(srcDir, ZNX_STRUCT.subfolders.src.FOLDER)

  const serName = getSrcName()

  assertEquals(serName, ZNX_STRUCT.subfolders.src.NAME)
})

Deno.test('saveZanixConfig should write a valid config file', async () => {
  // Mock config
  const temporaryFolder = getTemporaryFolder(import.meta.url)
  const mockFileConfig = temporaryFolder + '/deno.jsonc'
  await Deno.writeTextFile(mockFileConfig, '{}')
  const mockCwd = stub(Deno, 'cwd', () => temporaryFolder)

  await saveZanixConfig('library')
  const file = JSON.parse(await Deno.readTextFile(mockFileConfig))

  assert(file.zanix.project === 'library')
  assert(file.lint.rules.tags[0] === 'recommended')
  assert(file.lint.plugins[0] === 'jsr:@zanix/utils/linter/deno-zanix-plugin')
  assertExists(file.zanix.hash)
  assertExists(file.name)
  assertExists(file.fmt)
  assertExists(file.lint)

  await Deno.remove(mockFileConfig)
  mockCwd.restore()
})

Deno.test('saveZanixConfig should update an existing config file', async () => {
  // Mock config
  const temporaryFolder = getTemporaryFolder(import.meta.url)
  const mockFileConfig = temporaryFolder + '/deno.jsonc'
  await Deno.writeTextFile(
    mockFileConfig,
    JSON.stringify({
      'name': '@zanix/utils',
      'version': '1.0.0',
      'license': 'MIT',
      'compilerOptions': {
        'strict': false,
      },
      'exports': { '.': './mod.ts' },
      'lint': {
        'rules': {
          'tags': ['recommended'],
          'include': ['other-rule', 'eqeqeq'],
        },
        'exclude': ['.some'],
        'plugins': ['./other/plugin.ts'],
        'report': 'pretty',
      },
      'fmt': {
        'exclude': [],
        'proseWrap': 'always',
        'indentWidth': 1,
        'singleQuote': false,
        'lineWidth': 100,
        'useTabs': false,
        'semiColons': false,
      },
      'imports': {
        '@std/assert': 'jsr:@std/assert@0.224',
        '@std/fmt': 'jsr:@std/fmt@0.224',
        'example/': './src/linter/',
        'typings/': './src/typings/',
      },
    }),
  )

  const mockCwd = stub(Deno, 'cwd', () => temporaryFolder)

  await saveZanixConfig('library')
  const file = JSON.parse(await Deno.readTextFile(mockFileConfig))

  assert(file.zanix.project === 'library')
  assertEquals(file.compilerOptions, {
    'strict': false,
    'noImplicitAny': true,
  })
  assertEquals(file.zanix, {
    'project': 'library',
    'hash': 'zu226a',
  })
  assertExists(file.name)
  assert(file.imports['@tests/'] === undefined)

  assertEquals(file.lint.rules.tags, ['recommended', 'jsr'])

  assertEquals(file.fmt, {
    'exclude': [],
    'proseWrap': 'always',
    'indentWidth': 2,
    'singleQuote': true,
    'lineWidth': 100,
    'useTabs': false,
    'semiColons': false,
  })

  assertEquals(file.lint.rules.include, ['other-rule', ...linterBaseRules])
  assert(file.lint.plugins.includes('jsr:@zanix/utils/linter/deno-zanix-plugin'))
  assertExists(file.imports['typings/'])
  assertExists(file.imports['modules/'])
  assertExists(file.imports['shared/'])
  assertExists(file.imports['utils/'])
  assertExists(file.imports['example/'])

  await Deno.remove(mockFileConfig)
  mockCwd.restore()
})
