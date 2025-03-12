import type { ZanixLibraryFolders } from 'typings/zanix.ts'
import { getFolderName } from 'modules/helpers/paths.ts'

export const getLibraryFolders = (root: string): ZanixLibraryFolders => ({
  FOLDER: `${root}/src/modules`,
  get NAME() {
    return getFolderName(this.FOLDER)
  },
  files: {
    EXAMPLE: `${root}/src/modules/mod.ts`,
  },
})
