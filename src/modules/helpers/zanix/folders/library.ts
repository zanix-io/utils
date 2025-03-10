import { getFolderName, getRootDir } from 'modules/helpers/paths.ts'

const root: string = getRootDir()

export const library: LibraryFolders = {
  FOLDER: `${root}/src/modules`,
  get NAME() {
    return getFolderName(this.FOLDER)
  },
  files: {
    EXAMPLE: `${root}/src/modules/mod.ts`,
  },
}

export type LibraryFolders = {
  FOLDER: string
  get NAME(): string
  files: {
    EXAMPLE: string
  }
}
