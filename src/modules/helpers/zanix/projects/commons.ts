import type { ZanixFolderTree } from 'modules/types/mod.ts'

import { DISTRIBUTION_FILE, MAIN_MODULE } from 'utils/constants.ts'
import { getFolderName } from 'modules/helpers/paths.ts'
import zanixLibInfo from '../info.ts'

let commonTree: ZanixFolderTree | undefined

export const getCommonTree = (root: string): ZanixFolderTree => {
  if (root === commonTree?.FOLDER) return commonTree
  return {
    FOLDER: root,
    get NAME() {
      return getFolderName(this.FOLDER)
    },
    templates: {
      base: [{
        PATH: `${root}${MAIN_MODULE}`,
        content(local) {
          return zanixLibInfo.templateContent({ local, root, path: this.PATH })
        },
      }, {
        PATH: `${root}README.md`,
        content(local) {
          return zanixLibInfo.templateContent({ local, root, path: this.PATH })
        },
      }],
    },
    subfolders: {
      dist: {
        FOLDER: `${root}.dist`,
        get NAME() {
          return getFolderName(this.FOLDER)
        },
        templates: {
          base: [{
            PATH: `${root}.dist/${DISTRIBUTION_FILE}`,
            content(local) {
              return zanixLibInfo.templateContent({ local, root, path: this.PATH })
            },
          }],
        },
      },
      docs: {
        FOLDER: `${root}docs`,
        get NAME() {
          return getFolderName(this.FOLDER)
        },
        templates: {
          base: [{
            PATH: `${root}docs/CHANGELOG.md`,
            content(local) {
              return zanixLibInfo.templateContent({ local, root, path: this.PATH })
            },
          }, {
            PATH: `${root}docs/LICENCE`,
            content(local) {
              return zanixLibInfo.templateContent({ local, root, path: this.PATH })
            },
          }],
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
                templates: {
                  base: [{
                    PATH: `${root}src/@tests/functional/example.test.ts`,
                    content(local) {
                      return zanixLibInfo.templateContent({ local, root, path: this.PATH })
                    },
                  }],
                },
              },
              integration: {
                FOLDER: `${root}src/@tests/integration`,
                get NAME() {
                  return getFolderName(this.FOLDER)
                },
                templates: {
                  base: [{
                    PATH: `${root}src/@tests/integration/example.test.ts`,
                    content(local) {
                      return zanixLibInfo.templateContent({ local, root, path: this.PATH })
                    },
                  }],
                },
              },
              unit: {
                FOLDER: `${root}src/@tests/unit`,
                get NAME() {
                  return getFolderName(this.FOLDER)
                },
                templates: {
                  base: [{
                    PATH: `${root}src/@tests/unit/example.test.ts`,
                    content(local) {
                      return zanixLibInfo.templateContent({ local, root, path: this.PATH })
                    },
                  }],
                },
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
            templates: {
              base: [{
                PATH: `${root}src/typings/index.d.ts`,
                content(local) {
                  return zanixLibInfo.templateContent({ local, root, path: this.PATH })
                },
              }],
            },
          },
          utils: {
            FOLDER: `${root}src/utils`,
            get NAME() {
              return getFolderName(this.FOLDER)
            },
            templates: {
              base: [{
                PATH: `${root}src/utils/example.ts`,
                content(local) {
                  const opts = { local, root, path: this.PATH, library: '@zanix/utils' as const }
                  return zanixLibInfo.templateContent(opts)
                },
              }],
            },
          },
        },
      },
    },
  }
}
