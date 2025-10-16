import type { ConfigFile } from 'typings/config.ts'

import { CONFIG_FILE } from 'utils/constants.ts'
import { getConfigDir } from './paths.ts'
import { isFileUrl } from 'utils/urls.ts'
import regex from 'utils/regex.ts'
import { stripComments } from 'utils/strings.ts'

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
  if (configFile && currentConfigPath === configPath) return configFile

  const configDir = configPath || getConfigDir()
  currentConfigPath = configDir

  if (!configDir) {
    throw new Error(`Configuration file not found: ${configDir}`)
  }

  configFile = JSON.parse(stripComments(Deno.readTextFileSync(configDir)))

  return configFile as ConfigFile
}

/**
 * Reads and parses the runtime module `deno` configuration file
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
    configContent = await Deno.readTextFile(configFile)
  } else {
    const url = metaUrl.replace(regex.jsrBaseUrlRegex, '$1')

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
export async function saveConfig(config: ConfigFile, path?: string | null): Promise<void> {
  configFile = null // reset saved config file data
  const configDir = path || getConfigDir()
  const formattedContent = JSON.stringify(config, null, 2)
  await Deno.writeTextFile(configDir || 'deno.jsonc', formattedContent)
}
