import type { ZanixLibraries, ZanixLocalContentProps } from 'typings/zanix.ts'

import { readFileFromCurrentUrl } from 'modules/helpers/files.ts'

const titleRegex = /<title>(v[\d\.]+)<\/title>/

let ZNX_LIBRARIES: ZanixLibraries

/**
 * Fetches the lates release of a repository (e.g., @zanix/utils) from Shields.io.
 * This function retrieves the version of a library by querying the Shields.io JSR badge URL.
 *
 * @param lib - library name
 * @param username - library username. Defaults to `zanix-io`
 * @returns x.x.x version
 *
 * This function is intended for development purposes only.
 */
export function getLatestRelease(lib: string, username = 'zanix-io'): Promise<string> {
  return fetch(`https://img.shields.io/github/v/release/${username}/${lib}?color=blue&&label=`)
    .then((response) => response.text())
    .then((html) => {
      return html.match(titleRegex)?.[1].replace('v', '') || 'latest'
    })
    .catch(() => 'latest')
}

/**
 * Fetches the versions and names of all ZNX libraries.
 *
 * @returns {ZanixLibraries} An object where each key is the name of a ZNX library, and the corresponding value is its version.
 *
 * @example
 * const ZNX_LIBRARIES = {
 *   "utils": "2.0.1",
 *   "server": "1.0.3"
 * };
 *
 * This function is intended for development purposes only.
 */
export async function getAllZanixLibrariesInfo(): Promise<ZanixLibraries> {
  if (ZNX_LIBRARIES) return ZNX_LIBRARIES
  const versionPromises = [
    getLatestRelease('app'),
    getLatestRelease('auth'),
    getLatestRelease('asyncmq'),
    getLatestRelease('core'),
    getLatestRelease('datamaster'),
    getLatestRelease('server'),
    getLatestRelease('tasker'),
    getLatestRelease('utils'),
  ]
  const [app, auth, asyncmq, core, datamaster, server, tasker, utils] = await Promise.all(
    versionPromises,
  )
  ZNX_LIBRARIES = {
    '@zanix/app': { version: app },
    '@zanix/auth': { version: auth },
    '@zanix/asyncmq': { version: asyncmq },
    '@zanix/core': { version: core },
    '@zanix/datamaster': { version: datamaster },
    '@zanix/server': { version: server },
    '@zanix/tasker': { version: tasker },
    '@zanix/utils': { version: utils },
  }
  return ZNX_LIBRARIES
}

/**
 * Function to get template file content
 */
async function getZanixTemplateContent(
  { local, path, library, root }: {
    local: ZanixLocalContentProps
    root: string
    path: string
    library?: keyof ZanixLibraries
  },
) {
  if (library) {
    const libs = await getAllZanixLibrariesInfo()
    local.metaUrl = `https://jsr.io/${library}/${libs[library].version}/current`
    local.relativePath = ''
  }
  path = path.replace(root, local.relativePath)
  return readFileFromCurrentUrl(local.metaUrl, path).catch(() => '')
}

export default {
  templateContent: getZanixTemplateContent,
}
