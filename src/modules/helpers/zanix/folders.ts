import type { FolderStructure, ZanixProjects } from 'typings/zanix.ts'

import { getZnxStruct, ZNX_STRUCT } from './projects/main.ts'

/**
 * Retrieves the recommended folder structure for `Zanix` projects based on the provided type.
 *
 * @template T - A generic type parameter that must extend `ZanixProjects`.
 *
 * @param type - The type of the structure to retrieve.
 *                Use `server` to get the backend API folder structure, `app`
 *                to get the frontend SSR folder structure, or `library`.
 *
 *                If you want to get `server` and `app` together, send `app-server` type.
 *
 *                Defaults (undefined) to sending the entire structure.
 *
 * @param projectDir - The custom project dir `cwd`. Defaults to initial root.
 *
 * @returns A nested object representing the folder structure for the given type.
 *
 * This function requires the following permissions:
 * `allow-read` for `deno` config json file.
 *
 * @tags `allow-read`
 * @category helpers
 */
export function getZanixPaths<
  T extends ZanixProjects = 'app-server',
>(type?: T, projectDir?: string): FolderStructure<T> {
  const baseStruct = projectDir ? getZnxStruct(`${projectDir}/`) : ZNX_STRUCT
  const subfolders = { ...baseStruct.subfolders.src.subfolders }

  const deleteSubfolder = (folder: keyof typeof subfolders) => {
    delete subfolders[folder]
  }

  switch (type) {
    case 'app': {
      deleteSubfolder('library')
      deleteSubfolder('server')
      break
    }
    case 'server': {
      deleteSubfolder('library')
      deleteSubfolder('app')
      break
    }
    case 'library': {
      deleteSubfolder('app')
      deleteSubfolder('server')
      break
    }
    case 'app-server': {
      deleteSubfolder('library')
    }
  }

  const znxStruct = {
    ...baseStruct,
    subfolders: {
      ...baseStruct.subfolders,
      src: {
        ...baseStruct.subfolders.src,
        subfolders,
      },
    },
  }

  return znxStruct as FolderStructure<T>
}

/**
 * Gets the `source` directory `path` (assuming it is always at the root level for Zanix projects)
 *
 * @category helpers
 */
export function getSrcDir(): string {
  return ZNX_STRUCT.subfolders.src.FOLDER
}

/**
 * Gets the `source` directory `name` for Zanix projects
 *
 * @category helpers
 */
export function getSrcName(): string {
  return ZNX_STRUCT.subfolders.src.NAME
}
