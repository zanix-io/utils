import type { ZanixFolderTree, ZanixProjectsFull } from 'typings/zanix.ts'

import { getFolderName } from 'modules/helpers/paths.ts'
import { getCommonTree } from './commons.ts'
import { getServerFolders } from './server.ts'
import { getLibraryFolders } from './library.ts'
import { getAppFolders } from './app.ts'

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
    ZNX_STRUCT.subfolders.src.subfolders.library = getLibraryFolders(root)
  }

  if (type !== 'library' || isAll) {
    ZNX_STRUCT.subfolders.zanix = {
      FOLDER: `${root}zanix`,
      get NAME() {
        return getFolderName(this.FOLDER)
      },
      files: {
        CONFIG: `${root}zanix/config.ts`,
        SECRETS: `${root}zanix/secrets.sqlite`,
      },
    }

    ZNX_STRUCT.subfolders.src.subfolders.shared.subfolders = {
      middlewares: {
        FOLDER: `${root}src/shared/middlewares`,
        get NAME() {
          return getFolderName(this.FOLDER)
        },
        files: {
          EXAMPLE_PIPE: `${root}src/shared/middlewares/example.pipe.ts`,
          EXAMPLE_INTERCEPTOR: `${root}src/shared/middlewares/example.interceptor.ts`,
        },
      },
    }

    if (type === 'app' || type === 'app-server' || isAll) {
      ZNX_STRUCT.subfolders.src.subfolders.app = getAppFolders(root)
    }

    if (type === 'server' || type === 'app-server' || isAll) {
      ZNX_STRUCT.subfolders.src.subfolders.server = getServerFolders(root)
    }
  }

  return ZNX_STRUCT as ZanixFolderTree<T>
}
