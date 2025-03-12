import type { ZanixLibraryFolders } from 'typings/zanix.ts'
import { getFolderName, getRootDir } from 'modules/helpers/paths.ts'

const root: string = getRootDir()

export const library: ZanixLibraryFolders = {
  FOLDER: `${root}/src/modules`,
  get NAME() {
    return getFolderName(this.FOLDER)
  },
  files: {
    EXAMPLE: `${root}/src/modules/mod.ts`,
  },
}
