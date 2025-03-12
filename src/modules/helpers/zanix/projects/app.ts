import type { ZanixAppFolders } from 'typings/zanix.ts'

import { getFolderName, getRootDir } from 'modules/helpers/paths.ts'

const root: string = getRootDir()

export const app: ZanixAppFolders = {
  FOLDER: `${root}/src/app`,
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
        EXAMPLE: `${root}/src/app/components/Example.txs`,
      },
    },
    layout: {
      FOLDER: `${root}/src/app/layout`,
      get NAME() {
        return getFolderName(this.FOLDER)
      },
      files: {
        EXAMPLE: `${root}/src/app/layout/GlobalFooter.txs`,
      },
    },
    pages: {
      FOLDER: `${root}/src/app/pages`,
      get NAME() {
        return getFolderName(this.FOLDER)
      },
      files: {
        EXAMPLE: `${root}/src/app/pages/Home.tsx`,
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
                    EXAMPLE: `${root}/src/resources/public/assets/docs/example.doc`,
                  },
                },
                fonts: {
                  FOLDER: `${root}/src/resources/public/assets/fonts`,
                  get NAME() {
                    return getFolderName(this.FOLDER)
                  },
                  files: {
                    EXAMPLE: `${root}/src/resources/public/assets/fonts/example.font`,
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
  },
}
