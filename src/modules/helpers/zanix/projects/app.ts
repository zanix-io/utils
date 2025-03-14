import type { ZanixAppSrcTree } from 'typings/zanix.ts'

import { getFolderName } from 'modules/helpers/paths.ts'

let appTree: ZanixAppSrcTree | undefined

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
        files: {
          EXAMPLE: `${root}/src/app/components/ExampleComponent.txs`,
        },
      },
      layout: {
        FOLDER: `${root}/src/app/layout`,
        get NAME() {
          return getFolderName(this.FOLDER)
        },
        files: {
          EXAMPLE: `${root}/src/app/layout/ExampleLayout.txs`,
        },
      },
      pages: {
        FOLDER: `${root}/src/app/pages`,
        get NAME() {
          return getFolderName(this.FOLDER)
        },
        files: {
          EXAMPLE: `${root}/src/app/pages/ExamplePage.tsx`,
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
                files: {
                  EXAMPLE: `${root}/src/resources/intl/es/example.json`,
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
                    files: {
                      EXAMPLE: `${root}/src/resources/public/assets/docs/example.txt`,
                    },
                  },
                  fonts: {
                    FOLDER: `${root}/src/resources/public/assets/fonts`,
                    get NAME() {
                      return getFolderName(this.FOLDER)
                    },
                    files: {
                      EXAMPLE: `${root}/src/resources/public/assets/fonts/example.woff2`,
                    },
                  },
                  icons: {
                    FOLDER: `${root}/src/resources/public/assets/icons`,
                    get NAME() {
                      return getFolderName(this.FOLDER)
                    },
                    files: {
                      EXAMPLE: `${root}/src/resources/public/assets/icons/example.svg`,
                    },
                  },
                  images: {
                    FOLDER: `${root}/src/resources/public/assets/images`,
                    get NAME() {
                      return getFolderName(this.FOLDER)
                    },
                    files: {
                      EXAMPLE: `${root}/src/resources/public/assets/images/example.webp`,
                    },
                  },
                  videos: {
                    FOLDER: `${root}/src/resources/public/assets/videos`,
                    get NAME() {
                      return getFolderName(this.FOLDER)
                    },
                    files: {
                      EXAMPLE: `${root}/src/resources/public/assets/videos/example.webm`,
                    },
                  },
                },
              },
              scripts: {
                FOLDER: `${root}/src/resources/public/scripts`,
                get NAME() {
                  return getFolderName(this.FOLDER)
                },
                files: {
                  EXAMPLE: `${root}/src/resources/public/scripts/example.js`,
                },
              },
              sitemap: {
                FOLDER: `${root}/src/resources/public/sitemap`,
                get NAME() {
                  return getFolderName(this.FOLDER)
                },
                files: {
                  EXAMPLE_MAIN: `${root}/src/resources/public/scripts/main.xml`,
                  EXAMPLE_URL: `${root}/src/resources/public/scripts/urls.xml`,
                },
              },
              styles: {
                FOLDER: `${root}/src/resources/public/styles`,
                get NAME() {
                  return getFolderName(this.FOLDER)
                },
                files: {
                  fonts: `${root}/src/resources/public/styles/font.css`,
                },
                subfolders: {
                  apps: {
                    FOLDER: `${root}/src/resources/public/styles/apps`,
                    get NAME() {
                      return getFolderName(this.FOLDER)
                    },
                    files: {
                      EXAMPLE: `${root}/src/resources/public/styles/apps/example.app.css`,
                    },
                  },
                  global: {
                    FOLDER: `${root}/src/resources/public/styles/global`,
                    get NAME() {
                      return getFolderName(this.FOLDER)
                    },
                    files: {
                      EXAMPLE: `${root}/src/resources/public/styles/global/example.css`,
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
