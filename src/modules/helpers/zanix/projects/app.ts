import type { ZanixAppSrcTree } from 'typings/zanix.ts'

import { getFolderName } from 'modules/helpers/paths.ts'
import zanixLibInfo from '../info.ts'

let appTree: ZanixAppSrcTree | undefined

const library = '@zanix/app' as const

export const getAppFolders = (root: string): ZanixAppSrcTree => {
  const mainFolder = `${root}/src/app`
  if (appTree?.FOLDER === mainFolder) return appTree

  return {
    FOLDER: mainFolder,
    get NAME() {
      return getFolderName(this.FOLDER)
    },
    subfolders: {
      components: {
        FOLDER: `${root}/src/app/components`,
        get NAME() {
          return getFolderName(this.FOLDER)
        },
        templates: {
          base: [{
            PATH: `${root}/src/app/components/ExampleComponent.txs`,
            content(local) {
              const opts = { local, root, path: this.PATH, library }
              return zanixLibInfo.templateContent(opts)
            },
          }],
        },
      },
      layout: {
        FOLDER: `${root}/src/app/layout`,
        get NAME() {
          return getFolderName(this.FOLDER)
        },
        templates: {
          base: [{
            PATH: `${root}/src/app/layout/ExampleLayout.txs`,
            content(local) {
              const opts = { local, root, path: this.PATH, library }
              return zanixLibInfo.templateContent(opts)
            },
          }],
        },
      },
      pages: {
        FOLDER: `${root}/src/app/pages`,
        get NAME() {
          return getFolderName(this.FOLDER)
        },
        templates: {
          base: [{
            PATH: `${root}/src/app/pages/ExamplePage.tsx`,
            content(local) {
              const opts = { local, root, path: this.PATH, library }
              return zanixLibInfo.templateContent(opts)
            },
          }],
        },
      },
      resources: {
        FOLDER: `${root}/src/resources`,
        get NAME() {
          return getFolderName(this.FOLDER)
        },
        subfolders: {
          intl: {
            FOLDER: `${root}/src/resources/intl`,
            get NAME() {
              return getFolderName(this.FOLDER)
            },
            subfolders: {
              es: {
                FOLDER: `${root}/src/resources/intl/es`,
                get NAME() {
                  return getFolderName(this.FOLDER)
                },
                templates: {
                  base: [{
                    PATH: `${root}/src/resources/intl/es/example.json`,
                    content(local) {
                      const opts = { local, root, path: this.PATH, library }
                      return zanixLibInfo.templateContent(opts)
                    },
                  }],
                },
              },
            },
          },
          public: {
            FOLDER: `${root}/src/resources/public`,
            get NAME() {
              return getFolderName(this.FOLDER)
            },
            subfolders: {
              assets: {
                FOLDER: `${root}/src/resources/public/assets`,
                get NAME() {
                  return getFolderName(this.FOLDER)
                },
                subfolders: {
                  docs: {
                    FOLDER: `${root}/src/resources/public/assets/docs`,
                    get NAME() {
                      return getFolderName(this.FOLDER)
                    },
                    templates: {
                      base: [{
                        PATH: `${root}/src/resources/public/assets/docs/example.txt`,
                        content(local) {
                          const opts = { local, root, path: this.PATH, library }
                          return zanixLibInfo.templateContent(opts)
                        },
                      }],
                    },
                  },
                  fonts: {
                    FOLDER: `${root}/src/resources/public/assets/fonts`,
                    get NAME() {
                      return getFolderName(this.FOLDER)
                    },
                    templates: {
                      base: [{
                        PATH: `${root}/src/resources/public/assets/fonts/example.woff2`,
                        content(local) {
                          const opts = { local, root, path: this.PATH, library }
                          return zanixLibInfo.templateContent(opts)
                        },
                      }],
                    },
                  },
                  icons: {
                    FOLDER: `${root}/src/resources/public/assets/icons`,
                    get NAME() {
                      return getFolderName(this.FOLDER)
                    },
                    templates: {
                      base: [{
                        PATH: `${root}/src/resources/public/assets/icons/example.svg`,
                        content(local) {
                          const opts = { local, root, path: this.PATH, library }
                          return zanixLibInfo.templateContent(opts)
                        },
                      }],
                    },
                  },
                  images: {
                    FOLDER: `${root}/src/resources/public/assets/images`,
                    get NAME() {
                      return getFolderName(this.FOLDER)
                    },
                    templates: {
                      base: [{
                        PATH: `${root}/src/resources/public/assets/images/example.webp`,
                        content(local) {
                          const opts = { local, root, path: this.PATH, library }
                          return zanixLibInfo.templateContent(opts)
                        },
                      }],
                    },
                  },
                  videos: {
                    FOLDER: `${root}/src/resources/public/assets/videos`,
                    get NAME() {
                      return getFolderName(this.FOLDER)
                    },
                    templates: {
                      base: [{
                        PATH: `${root}/src/resources/public/assets/videos/example.webm`,
                        content(local) {
                          const opts = { local, root, path: this.PATH, library }
                          return zanixLibInfo.templateContent(opts)
                        },
                      }],
                    },
                  },
                },
              },
              scripts: {
                FOLDER: `${root}/src/resources/public/scripts`,
                get NAME() {
                  return getFolderName(this.FOLDER)
                },
                templates: {
                  base: [{
                    PATH: `${root}/src/resources/public/scripts/example.js`,
                    content(local) {
                      const opts = { local, root, path: this.PATH, library }
                      return zanixLibInfo.templateContent(opts)
                    },
                  }],
                },
              },
              sitemap: {
                FOLDER: `${root}/src/resources/public/sitemap`,
                get NAME() {
                  return getFolderName(this.FOLDER)
                },
                templates: {
                  base: [{
                    PATH: `${root}/src/resources/public/scripts/main.xml`,
                    content(local) {
                      const opts = { local, root, path: this.PATH, library }
                      return zanixLibInfo.templateContent(opts)
                    },
                  }, {
                    PATH: `${root}/src/resources/public/scripts/urls.xml`,
                    content(local) {
                      const opts = { local, root, path: this.PATH, library }
                      return zanixLibInfo.templateContent(opts)
                    },
                  }],
                },
              },
              styles: {
                FOLDER: `${root}/src/resources/public/styles`,
                get NAME() {
                  return getFolderName(this.FOLDER)
                },
                templates: {
                  base: [{
                    PATH: `${root}/src/resources/public/styles/font.css`,
                    content(local) {
                      const opts = { local, root, path: this.PATH, library }
                      return zanixLibInfo.templateContent(opts)
                    },
                  }],
                },
                subfolders: {
                  apps: {
                    FOLDER: `${root}/src/resources/public/styles/apps`,
                    get NAME() {
                      return getFolderName(this.FOLDER)
                    },
                    templates: {
                      base: [{
                        PATH: `${root}/src/resources/public/styles/apps/example.app.css`,
                        content(local) {
                          const opts = { local, root, path: this.PATH, library }
                          return zanixLibInfo.templateContent(opts)
                        },
                      }],
                    },
                  },
                  global: {
                    FOLDER: `${root}/src/resources/public/styles/global`,
                    get NAME() {
                      return getFolderName(this.FOLDER)
                    },
                    templates: {
                      base: [{
                        PATH: `${root}/src/resources/public/styles/global/example.css`,
                        content(local) {
                          const opts = { local, root, path: this.PATH, library }
                          return zanixLibInfo.templateContent(opts)
                        },
                      }],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }
}
