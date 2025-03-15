import type { ZanixFolderTree } from 'modules/types/mod.ts'

import { DISTRIBUTION_FILE, MAIN_MODULE } from 'utils/constants.ts'
import { ZanixTree } from 'modules/helpers/zanix/base-tree.ts'

let commonTree: ZanixFolderTree | undefined

export const getCommonTree = (root: string): ZanixFolderTree => {
  if (root === commonTree?.FOLDER) return commonTree

  return ZanixTree.create<ZanixFolderTree>(root, {
    templates: { base: { files: [MAIN_MODULE, 'README.md'] } },
    subfolders: {
      '.dist': { templates: { base: { files: [DISTRIBUTION_FILE] } } },
      docs: { templates: { base: { files: ['CHANGELOG.md', 'LICENCE'] } } },
      src: {
        subfolders: {
          tests: {
            subfolders: {
              integration: { templates: { base: { files: ['example.test.ts'] } } },
              unit: { templates: { base: { files: ['example.test.ts'] } } },
              functional: { templates: { base: { files: ['example.test.ts'] } } },
            },
          },
          shared: { subfolders: {} },
          typings: { templates: { base: { files: ['index.d.ts'] } } },
          utils: { templates: { base: { files: ['example.ts'], library: '@zanix/utils' } } },
        },
      },
    },
  })
}
