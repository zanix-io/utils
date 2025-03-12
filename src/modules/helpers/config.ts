import type { ConfigFile } from 'typings/config.ts'

import { setGlobalZnx } from 'modules/helpers/zanix/namespace.ts'
import { getConfigDir } from './paths.ts'

let configFile: ConfigFile | null = null

/**
 * Reads and parses the `deno` configuration file
 *
 * @param configPath - The optional file config dir.
 *
 * This function requires the following permissions:
 * `allow-read` for `deno` config json file.
 */
export function readConfig(configPath?: string | null): ConfigFile {
  if (configFile) return configFile

  const configDir = configPath || getConfigDir()

  if (!configDir) {
    throw new Error(`Configuration file not found: ${configDir}`)
  }

  configFile = JSON.parse(Deno.readTextFileSync(configDir))

  if (configFile?.zanix) {
    // If the config file has a 'zanix' property, it indicates that it's a Zanix project,
    // and configuration data is required to set it up.
    setGlobalZnx({ config: configFile.zanix })
  }
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
 */
export async function saveConfig(config: ConfigFile, path?: string | null): Promise<void> {
  configFile = null // reset saved config file data
  const configDir = path || getConfigDir()
  const formattedContent = JSON.stringify(config, null, 2)
  await Deno.writeTextFile(configDir || 'deno.jsonc', formattedContent)
}
