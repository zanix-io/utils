import type { Config } from 'typings/config.ts'
import type { Projects } from 'typings/zanix.ts'

import { getZanixPaths } from 'modules/helpers/zanix/projects.ts'
import { generateImports, generateZanixHash, linterBaseRules } from './main.ts'
import { ZNX_STRUCT } from 'modules/helpers/zanix/folders/mod.ts'

/**
 * Define a base `deno` configuration file
 * @param type - Zanix project type (`server`, `app`, `app-server` or `library`)
 */
export function baseZnxConfig(type: Projects): Config {
  const znxMainFolders = getZanixPaths(type).subfolders
  const dist = znxMainFolders.dist.NAME
  const name = '@project/name'
  const imports = generateImports(znxMainFolders.src)
  const linterTags = ['recommended', 'jsr']
  const compilerOptions: Config['compilerOptions'] = {
    strict: true,
    noImplicitAny: true,
  }

  if (type === 'app' || type === 'app-server') {
    linterTags.push(...['react', 'jsx'])
    compilerOptions.jsx = 'react'
  }

  return {
    name,
    zanix: {
      project: type,
      hash: generateZanixHash(name),
    },
    compilerOptions,
    lint: {
      rules: {
        tags: linterTags,
        include: linterBaseRules,
      },
      exclude: [dist],
      plugins: [
        'jsr:@zanix/utils/linter/deno-zanix-plugin',
      ],
      report: 'pretty',
    },
    fmt: {
      exclude: [dist],
      proseWrap: 'always',
      indentWidth: 2,
      singleQuote: true,
      lineWidth: 100,
      useTabs: false,
      semiColons: false,
    },
    imports,
    publish: {
      exclude: [
        '.github',
        ZNX_STRUCT.subfolders.src.NAME + '/' +
        ZNX_STRUCT.subfolders.src.subfolders.tests.NAME,
      ],
    },
  }
}
