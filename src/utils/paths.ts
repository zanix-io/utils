import { fromFileUrl } from 'jsr:@std/path@^1.0.6'
import { dirname, join } from 'node:path'
import { fileExists } from 'utils/files.ts'
import { CONFIG_FILE } from 'utils/constants.ts'

/** Gets the root directory of the project */
export const getRootDir = (): string => {
  return Deno.cwd()
}

/** Gets the path to the `deno.json` configuration file */
export const getConfigDir = (): string | null => {
  const rootDir = getRootDir()
  const jsonFile = join(rootDir, CONFIG_FILE)
  const jsoncFile = join(rootDir, `${CONFIG_FILE}c`)

  if (fileExists(jsonFile)) return jsonFile
  if (fileExists(jsoncFile)) return jsoncFile

  return null
}

/** Gets the `src/` directory path (assuming it is always at the root level) */
export const getSrcDir = (): string => {
  return join(getRootDir(), 'src')
}

/** Gets the directory where this file (`paths.ts`) is located */
export const getCurrentDir = (): string => {
  return dirname(fromFileUrl(import.meta.url))
}
