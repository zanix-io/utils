import type { ZanixFolderTree } from 'modules/types/mod.ts'

import { getFolderName } from 'modules/helpers/paths.ts'

let commonTree: ZanixFolderTree | undefined

export const getCommonTree = (root: string): ZanixFolderTree => {
  if (root === commonTree?.FOLDER) return commonTree
  return {
    FOLDER: root,
    get NAME() {
      return getFolderName(this.FOLDER)
    },
    files: {
      MOD: `${root}mod.ts`,
      README: `${root}README.md`,
    },
    subfolders: {
      dist: {
        FOLDER: `${root}.dist`,
        get NAME() {
          return getFolderName(this.FOLDER)
        },
        files: { APP: `${root}.dist/app.js` },
      },
      docs: {
        FOLDER: `${root}docs`,
        get NAME() {
          return getFolderName(this.FOLDER)
        },
        files: {
          CHANGELOG: `${root}docs/CHANGELOG.md`,
          LICENCE: `${root}docs/LICENCE`,
        },
      },
      src: {
        FOLDER: `${root}src`,
        get NAME() {
          return getFolderName(this.FOLDER)
        },
        subfolders: {
          tests: {
            FOLDER: `${root}src/@tests`,
            get NAME() {
              return getFolderName(this.FOLDER)
            },
            subfolders: {
              functional: {
                FOLDER: `${root}src/@tests/functional`,
                get NAME() {
                  return getFolderName(this.FOLDER)
                },
                files: { EXAMPLE: `${root}src/@tests/functional/example.test.ts` },
              },
              integration: {
                FOLDER: `${root}src/@tests/integration`,
                get NAME() {
                  return getFolderName(this.FOLDER)
                },
                files: { EXAMPLE: `${root}src/@tests/integration/example.test.ts` },
              },
              unit: {
                FOLDER: `${root}src/@tests/unit`,
                get NAME() {
                  return getFolderName(this.FOLDER)
                },
                files: { EXAMPLE: `${root}src/@tests/unit/example.test.ts` },
              },
            },
          },
          shared: {
            FOLDER: `${root}src/shared`,
            get NAME() {
              return getFolderName(this.FOLDER)
            },
            subfolders: undefined as never,
          },
          typings: {
            FOLDER: `${root}src/typings`,
            get NAME() {
              return getFolderName(this.FOLDER)
            },
            files: {
              INDEX: `${root}src/typings/index.d.ts`,
            },
          },
          utils: {
            FOLDER: `${root}src/utils`,
            get NAME() {
              return getFolderName(this.FOLDER)
            },
            files: {
              EXAMPLE: `${root}src/utils/example.ts`,
            },
          },
        },
      },
    },
  }
}
