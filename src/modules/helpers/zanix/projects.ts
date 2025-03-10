import type { FolderStructure, Projects } from 'typings/zanix.ts'

import { ZNX_STRUCT } from './folders/mod.ts'
import { saveConfig } from 'modules/helpers/config.ts'
import { readConfig } from 'modules/helpers/mod.ts'
import { getConfigDir } from 'modules/helpers/paths.ts'
import { configAdaptation } from './config/adaptation.ts'
import { baseZnxConfig } from './config/mod.ts'

/**
 * Retrieves the recommended folder structure for Zanix projects based on the provided type.
 *
 * @param type - The type of the structure to retrieve.
 *                Use `server` to get the backend API folder structure, `app`
 *                to get the frontend SSR folder structure, or `library`.
 *
 *                If you want to get `server` and `app` together, send `app-server` type.
 *
 *                Defaults (undefined) to sending the entire structure.
 *
 * @returns A nested object representing the folder structure for the given type.
 *
 * This function requires the following permissions:
 * `allow-read` for `deno` config json file.
 */
export function getZanixPaths<
  T extends Projects = 'app-server',
>(type?: T): FolderStructure<T> {
  const subfolders = { ...ZNX_STRUCT.subfolders.src.subfolders }

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
    ...ZNX_STRUCT,
    subfolders: {
      ...ZNX_STRUCT.subfolders,
      src: {
        ...ZNX_STRUCT.subfolders.src,
        subfolders,
      },
    },
  }

  return znxStruct as FolderStructure<T>
}

/** Gets the `src/` directory path (assuming it is always at the root level for Zanix projects) */
export function getSrcDir(): string {
  return ZNX_STRUCT.subfolders.src.FOLDER
}

/** Gets the source directory name for Zanix projects */
export function getSrcName(): string {
  return ZNX_STRUCT.subfolders.src.NAME
}

/**
 * Write a `deno` base config file for **Zanix** projects
 * @param type - Zanix project type (`server`, `app`, `app-server` or `library`)
 *
 *               Defaults to `app-server`
 */
export async function saveZanixConfig(type: Projects = 'app-server') {
  let config = baseZnxConfig(type)
  const configPath = getConfigDir()

  try {
    const currentConfig = readConfig(configPath)
    config = configAdaptation(currentConfig, config)
  } catch {
    // Ignore error
  }

  await saveConfig(config, configPath)
}

// TODO: createBaseZanixProject to generate file and folder structure on CLI
// review to pass all this to cli
