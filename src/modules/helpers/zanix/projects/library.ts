import type { ZanixLibrarySrcTree } from 'typings/zanix.ts'

import { getFolderName } from 'modules/helpers/paths.ts'

export const getLibraryFolders = (root: string): ZanixLibrarySrcTree => ({
  FOLDER: `${root}/src/modules`,
  get NAME() {
    return getFolderName(this.FOLDER)
  },
  files: {
    EXAMPLE: `${root}/src/modules/mod.ts`,
  },
  subfolders: {
    templates: {
      FOLDER: `${root}/src/templates`,
      get NAME() {
        return getFolderName(this.FOLDER)
      },
    },
  },
})
