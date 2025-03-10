import { getFolderName, getRootDir } from 'modules/helpers/paths.ts'

const root = getRootDir()

export const library = {
  FOLDER: `${root}/src/modules`,
  get NAME() {
    return getFolderName(this.FOLDER)
  },
  files: {
    EXAMPLE: `${root}/src/modules/mod.ts`,
  },
}
