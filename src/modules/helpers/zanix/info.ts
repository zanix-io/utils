import type { ZanixLibraries } from 'typings/zanix.ts'

const titleRegex = /<title>(v[\d\.]+)<\/title>/

let ZNX_LIBRARIES: ZanixLibraries

const getShieldsDataVersion = (endpoint: string, username: string, lib: string) => {
  return fetch(`https://img.shields.io/${endpoint}/${username}/${lib}?color=blue&&label=`)
    .then((response) => response.text())
    .then((html) => {
      return html.match(titleRegex)?.[1].replace('v', '') || 'latest'
    })
    .catch(() => 'latest')
}

/**
 * Fetches the lates release of a repository (e.g., @zanix/utils) from Shields.io.
 * This function retrieves the version of a library by querying the Shields.io JSR badge URL.
 *
 * @param lib - library name
 * @param username - library username. Defaults to `zanix-io`
 * @returns x.x.x version
 *
 * This function is intended for CLI purposes only.
 */
export function getLatestRelease(lib: string, username = 'zanix-io'): Promise<string> {
  return getShieldsDataVersion('github/v/release', username, lib)
}

/**
 * Fetches the lates JSR version of a repository (e.g., @zanix/utils) from Shields.io.
 * This function retrieves the version of a library by querying the Shields.io JSR badge URL.
 *
 * @param lib - library name
 * @param username - library username. Defaults to `@zanix`
 * @returns x.x.x version
 *
 * This function is intended for CLI purposes only.
 */
export function getLatestVersion(lib: string, username = '@zanix'): Promise<string> {
  return getShieldsDataVersion('jsr/v', username, lib)
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
    getLatestVersion('app'),
    getLatestVersion('auth'),
    getLatestVersion('asyncmq'),
    getLatestVersion('core'),
    getLatestVersion('datamaster'),
    getLatestVersion('server'),
    getLatestVersion('worker'),
    getLatestVersion('utils'),
  ]
  const [app, auth, asyncmq, core, datamaster, server, worker, utils] = await Promise.all(
    versionPromises,
  )
  ZNX_LIBRARIES = {
    '@zanix/app': { version: app },
    '@zanix/auth': { version: auth },
    '@zanix/asyncmq': { version: asyncmq },
    '@zanix/core': { version: core },
    '@zanix/datamaster': { version: datamaster },
    '@zanix/server': { version: server },
    '@zanix/worker': { version: worker },
    '@zanix/utils': { version: utils },
  }
  return ZNX_LIBRARIES
}
