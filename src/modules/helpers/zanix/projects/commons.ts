import type { ZanixFolderTree, ZanixProjectsFull } from 'typings/zanix.ts'

import { MAIN_MODULE } from 'utils/constants.ts'
import { ZanixTree } from 'modules/helpers/zanix/base-tree.ts'

let commonTree: ZanixFolderTree | undefined

export const getCommonTree = (root: string, type?: ZanixProjectsFull): ZanixFolderTree => {
  if (root === commonTree?.FOLDER) return commonTree

  const mainFiles = ['README.md']
  if (type === 'library') mainFiles.push(MAIN_MODULE)

  return ZanixTree.create<ZanixFolderTree>(root, {
    templates: { base: { files: mainFiles } },
    subfolders: {
      '.dist': {},
      docs: { templates: { base: { files: ['CHANGELOG.md', 'LICENCE'], jsr: '@zanix/utils' } } },
      src: {
        subfolders: {
          '@tests': {
            subfolders: {
              integration: {
                templates: { base: { files: ['example.test.ts'], jsr: '@zanix/utils' } },
              },
              unit: { templates: { base: { files: ['example.test.ts'], jsr: '@zanix/utils' } } },
              functional: {
                templates: { base: { files: ['example.test.ts'], jsr: '@zanix/utils' } },
              },
            },
          },
          shared: { subfolders: {} },
          typings: { templates: { base: { files: ['index.d.ts'], jsr: '@zanix/utils' } } },
          utils: { templates: { base: { files: ['example.ts'], jsr: '@zanix/utils' } } },
        },
      },
    },
  })
}
