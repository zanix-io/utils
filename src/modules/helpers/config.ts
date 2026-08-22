import type { ConfigFile } from 'typings/config.ts'

import { dirname, fromFileUrl, join } from '@std/path'
import { CONFIG_FILE } from 'utils/constants.ts'
import { getConfigDir } from './paths.ts'
import { fileExists } from './files.ts'
import { isFileUrl } from 'utils/urls.ts'
import regex from 'utils/regex.ts'
import { stripComments } from 'utils/encoders.ts'

let configFile: ConfigFile | null = null
let currentConfigPath: string | null = null

/**
 * Reads and parses the `deno` configuration file
 *
 * @param configPath - The optional file config dir.
 *
 * This function requires the following permissions:
 * `allow-read` for `deno` config json file.
 *
 * @tags allow-read
 * @category helpers
 */
export function readConfig(configPath?: string | null): ConfigFile {
  const configDir = configPath || getConfigDir()

  if (configFile && currentConfigPath === configDir) return configFile

  currentConfigPath = configDir

  if (!configDir) {
    throw new Error(`Configuration file not found: ${configDir}`)
  }

  configFile = JSON.parse(stripComments(Deno.readTextFileSync(configDir)))

  return configFile as ConfigFile
}

/**
 * Walks up from `metaUrl`'s own directory (never `Deno.cwd()`) looking for `configFile`, mirroring
 * how the JSR-fetch branch strips a module subpath down to its package root. Bounded by the
 * filesystem root so it can't loop forever.
 *
 * @param metaUrl The module URL (`import.meta.url`) used as the starting point for the upward search.
 * @param configFile The configuration file name to look for in each ancestor directory.
 * @returns The absolute path to the first matching configuration file.
 */
function findLocalConfigPath(metaUrl: string, configFile: string): string {
  let dir = dirname(fromFileUrl(metaUrl))

  while (true) {
    const candidate = join(dir, configFile)
    if (fileExists(candidate)) return candidate

    const parent = dirname(dir)
    if (parent === dir) {
      throw new Deno.errors.NotFound(
        `Could not find '${configFile}' starting from '${metaUrl}'.`,
      )
    }
    dir = parent
  }
}

/**
 * Reads and parses the library module `deno` configuration file
 *
 * @param metaUrl - The optional file config dir.
 * @param isJsonc - The extension json type. Defaults to true.
 *
 * This function requires the following permissions:
 * `allow-read` for `deno` config json file.
 *
 * @tags allow-read
 * @category helpers
 */
export async function readModuleConfig(
  metaUrl: string,
  isJsonc = true,
): Promise<ConfigFile> {
  let configContent: string = '{}'
  const configFile = `${CONFIG_FILE}${isJsonc ? 'c' : ''}`

  if (isFileUrl(metaUrl)) {
    configContent = await Deno.readTextFile(
      findLocalConfigPath(metaUrl, configFile),
    )
  } else {
    const url = metaUrl.replace(regex.JSR_BASE_URL_REGEX, '$1')

    const response = await fetch(`${url}/${configFile}`)

    configContent = response.ok ? await response.text() : '{}'
  }
  const config = JSON.parse(stripComments(configContent)) as ConfigFile

  return config
}

/**
 * Writes or updates the configuration (`deno`) based on its existence
 *
 * @param config - The configuration object.
 * @param path - The optional file config dir.
 *
 * This function requires the following permissions:
 * `allow-read` and `allow-write` for `deno` config json file.
 *
 * @tags allow-read, allow-write
 * @category helpers
 */
export async function saveConfig(
  config: ConfigFile,
  path?: string | null,
): Promise<void> {
  configFile = null // reset saved config file data
  const configDir = path || getConfigDir()
  const formattedContent = JSON.stringify(config, null, 2)
  await Deno.writeTextFile(configDir || 'deno.jsonc', formattedContent)
}
