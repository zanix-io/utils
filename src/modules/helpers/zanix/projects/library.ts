import type { ZanixLibrarySrcTree } from 'typings/zanix.ts'

import { getFolderName } from 'modules/helpers/paths.ts'
import zanixLibInfo from '../info.ts'

export const getLibraryFolders = (root: string): ZanixLibrarySrcTree => ({
  FOLDER: `${root}/src/modules`,
  get NAME() {
    return getFolderName(this.FOLDER)
  },
  templates: {
    base: [{
      PATH: `${root}/src/modules/mod.ts`,
      content(local) {
        return zanixLibInfo.templateContent({ local, root, path: this.PATH })
      },
    }],
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
