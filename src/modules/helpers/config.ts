import type { ConfigFile } from 'typings/config.ts'

import { dirname, fromFileUrl, join } from '@std/path'
import { CONFIG_FILE } from 'utils/constants.ts'
import { getConfigDir } from './paths.ts'
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
 * Clears `readConfig()`'s module-level memoized result, forcing its next call — with any
 * `configPath` — to read the config file from disk again instead of returning the cached value.
 *
 * Test-only: production code relies on the cache staying warm for the process lifetime (that's
 * the whole point of memoizing a disk read); calling this outside a test defeats that. Reach for
 * it when a test needs to control what `readConfig()` (or anything that calls it internally,
 * e.g. the logger's `Znx.config`) resolves to, and an earlier call in the same process may have
 * already resolved and cached the real one first.
 *
 * @category testing
 */
export function resetConfig(): void {
  configFile = null
  currentConfigPath = null
}

/**
 * Walks up from `metaUrl`'s own directory (never `Deno.cwd()`) looking for `configFile`, mirroring
 * how the JSR-fetch branch strips a module subpath down to its package root. Bounded by the
 * filesystem root so it can't loop forever.
 *
 * Each candidate is stat'd directly (not via `fileExists`, which treats every error — including a
 * permission denial — as "not here") so a missing `--allow-read` grant is never mistaken for a
 * genuinely absent file: only `Deno.errors.NotFound` continues the walk to the parent directory;
 * any other error (`Deno.errors.NotCapable`/`PermissionDenied` when the read isn't permitted, or
 * anything else `Deno.statSync` can throw) propagates immediately, as itself, instead of surfacing
 * as a misleading `NotFound` once the walk reaches the filesystem root.
 *
 * @param metaUrl The module URL (`import.meta.url`) used as the starting point for the upward search.
 * @param configFile The configuration file name to look for in each ancestor directory.
 * @returns The absolute path to the first matching configuration file.
 * @throws {Deno.errors.NotFound} If no ancestor directory up to the filesystem root has `configFile`.
 * @throws {Deno.errors.NotCapable | Deno.errors.PermissionDenied} If reading a candidate path is
 * not permitted — this is never reported as `NotFound`.
 */
function findLocalConfigPath(metaUrl: string, configFile: string): string {
  let dir = dirname(fromFileUrl(metaUrl))

  while (true) {
    const candidate = join(dir, configFile)

    try {
      if (Deno.statSync(candidate).isFile) return candidate
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error
    }

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
 * For a `file:` `metaUrl`, the search walks up ancestor directories looking for the config file;
 * if `--allow-read` isn't granted for one of those directories, the permission error propagates
 * as itself instead of being reported as the config file simply not existing.
 *
 * @param metaUrl - The optional file config dir.
 * @param isJsonc - The extension json type. Defaults to true.
 * @throws {Deno.errors.NotFound} If `metaUrl` is a `file:` URL and no ancestor directory up to the
 * filesystem root has the config file.
 * @throws {Deno.errors.NotCapable | Deno.errors.PermissionDenied} If `metaUrl` is a `file:` URL and
 * reading a candidate directory along the way is not permitted.
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
