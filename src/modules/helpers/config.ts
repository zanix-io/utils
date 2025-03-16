import type { ConfigFile } from 'typings/config.ts'

import { getConfigDir } from './paths.ts'

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

  configFile = JSON.parse(Deno.readTextFileSync(configDir))

  return configFile as ConfigFile
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
