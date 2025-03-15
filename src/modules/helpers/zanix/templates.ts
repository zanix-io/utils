import type { ZanixLibraries } from 'typings/zanix.ts'

import { getAllZanixLibrariesInfo } from 'modules/helpers/zanix/info.ts'
import { readFileFromCurrentUrl } from 'modules/helpers/files.ts'

/**
 * Function to get template file content
 */
export async function getZanixTemplateContent(
  { url, path, jsr }: {
    url: string
    path: string
    jsr?: keyof ZanixLibraries
  },
) {
  if (jsr) {
    const libs = await getAllZanixLibrariesInfo()
    url = `https://jsr.io/${jsr}/${libs[jsr].version}/{current}`
  }

  return readFileFromCurrentUrl(url, path).catch(() => '')
}
