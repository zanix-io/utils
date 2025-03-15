import type { ZanixFolderTree, ZanixProjectsFull } from 'typings/zanix.ts'

import { ZanixTree } from 'modules/helpers/zanix/base-tree.ts'
import { getCommonTree } from './commons.ts'
import { getServerSrcTree } from './server.ts'
import { getLibrarySrcTree } from './library.ts'
import { getAppSrcTree } from './app.ts'
import { join } from '@std/path'

const library = '@zanix/core'

/**
 * Zanix folders function structure for all projects
 */
export const getZnxFolderTree = <
  T extends ZanixProjectsFull,
>(root: string, type?: T): ZanixFolderTree<T> => {
  let ZNX_STRUCT
  const commonTree = getCommonTree(root)

  if (!type) return commonTree as ZanixFolderTree<T>
  else ZNX_STRUCT = commonTree as unknown as ZanixFolderTree<'all'>

  const isAll = type === 'all'

  if (type === 'library' || isAll) {
    ZNX_STRUCT.subfolders.src.subfolders.modules = getLibrarySrcTree(root)
  }

  if (type !== 'library' || isAll) {
    ZNX_STRUCT.subfolders.zanix = ZanixTree.create(join(root, 'zanix'), {
      templates: { base: { files: ['config.ts', 'secrets.sqlite'], library } },
    })

    ZNX_STRUCT.subfolders.src.subfolders.shared = ZanixTree.create(
      join(root, 'src/shared'),
      {
        subfolders: {
          middlewares: {
            templates: {
              base: { files: ['example.pipe.ts', 'example.interceptor.ts'], library },
            },
          },
        },
      },
    )

    if (type === 'app' || type === 'app-server' || isAll) {
      ZNX_STRUCT.subfolders.src.subfolders.app = getAppSrcTree(root)
    }

    if (type === 'server' || type === 'app-server' || isAll) {
      ZNX_STRUCT.subfolders.src.subfolders.server = getServerSrcTree(root)
    }
  }

  return ZNX_STRUCT as ZanixFolderTree<T>
}
