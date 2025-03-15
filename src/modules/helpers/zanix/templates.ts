import type { ZanixLibraries, ZanixLocalContentProps } from 'typings/zanix.ts'

import { getAllZanixLibrariesInfo } from 'modules/helpers/zanix/info.ts'
import { readFileFromCurrentUrl } from 'modules/helpers/files.ts'

/**
 * Function to get template file content
 */
export async function getZanixTemplateContent(
  { local, path, library }: {
    local: ZanixLocalContentProps
    path: string
    library?: keyof ZanixLibraries
  },
) {
  if (library) {
    const libs = await getAllZanixLibrariesInfo()
    local.metaUrl = `https://jsr.io/${library}/${libs[library].version}/{current}`
    local.relativePath = ''
  }

  return readFileFromCurrentUrl(local.metaUrl, path).catch(() => '')
}
