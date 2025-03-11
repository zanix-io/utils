import { getConfigDir, getFolderName, getRootDir } from 'modules/helpers/paths.ts'
import { app, type AppFolders } from './app.ts'
import { library, type LibraryFolders } from './library.ts'
import { server, type ServerFolders } from './server.ts'

const root: string = `${getRootDir()}/`

/**
 * Zanix folders object structure
 */
export const ZNX_STRUCT: ZanixFolders = {
  FOLDER: `${root}`,
  get NAME() {
    return getFolderName(this.FOLDER)
  },
  files: {
    DENO: getConfigDir(),
    MOD: `${root}mod.ts`,
    README: `${root}README.md`,
    gitignore: `${root}.gitignore`,
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
        DOCUMENTATION: `${root}docs/DOCUMENTATION.md`,
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
              files: { EXAMPLE: `${root}src/@tests/functional/example.text.ts` },
            },
            integration: {
              FOLDER: `${root}src/@tests/integration`,
              get NAME() {
                return getFolderName(this.FOLDER)
              },
              files: { EXAMPLE: `${root}src/@tests/integration/example.text.ts` },
            },
            unit: {
              FOLDER: `${root}src/@tests/unit`,
              get NAME() {
                return getFolderName(this.FOLDER)
              },
              files: { EXAMPLE: `${root}src/@tests/unit/example.text.ts` },
            },
          },
        },
        app,
        library,
        server,
        shared: {
          FOLDER: `${root}src/shared`,
          get NAME() {
            return getFolderName(this.FOLDER)
          },
          subfolders: {
            middlewares: {
              FOLDER: `${root}src/shared/middlewares`,
              get NAME() {
                return getFolderName(this.FOLDER)
              },
              files: {
                EXAMPLE_PIPE: `${root}src/shared/middlewares/example.pipe.ts`,
                EXAMPLE_INTERCEPTOR: `${root}src/shared/middlewares/example.interceptor.ts`,
              },
            },
          },
        },
        typings: {
          FOLDER: `${root}src/typings`,
          get NAME() {
            return getFolderName(this.FOLDER)
          },
          files: {
            EXAMPLE: `${root}src/typings/example.d.ts`,
            EXAMPLE_EXPORTED: `${root}src/typings/example.type.ts`,
          },
        },
        utils: {
          FOLDER: `${root}src/utils`,
          get NAME() {
            return getFolderName(this.FOLDER)
          },
          files: {
            EXAMPLE: `${root}src/utils/example.utils.ts`,
          },
        },
      },
    },
    zanix: {
      FOLDER: `${root}zanix`,
      get NAME() {
        return getFolderName(this.FOLDER)
      },
      files: {
        CONFIG: `${root}zanix/config.ts`,
        SECRETS: `${root}zanix/secrets.sqlite`,
      },
    },
  },
}

type ZanixFolders = {
  FOLDER: string
  get NAME(): string
  files: {
    DENO: string | null
    MOD: string
    README: string
    gitignore: string
  }
  subfolders: {
    dist: {
      FOLDER: string
      get NAME(): string
      files: { APP: string }
    }
    docs: {
      FOLDER: string

      get NAME(): string
      files: {
        CHANGELOG: string
        DOCUMENTATION: string
        LICENCE: string
      }
    }
    src: {
      FOLDER: string

      get NAME(): string
      subfolders: {
        tests: {
          FOLDER: string

          get NAME(): string
          subfolders: {
            functional: {
              FOLDER: string

              get NAME(): string
              files: { EXAMPLE: string }
            }
            integration: {
              FOLDER: string

              get NAME(): string
              files: { EXAMPLE: string }
            }
            unit: {
              FOLDER: string

              get NAME(): string
              files: { EXAMPLE: string }
            }
          }
        }
        app: AppFolders
        library: LibraryFolders
        server: ServerFolders
        shared: {
          FOLDER: string

          get NAME(): string
          subfolders: {
            middlewares: {
              FOLDER: string

              get NAME(): string
              files: {
                EXAMPLE_PIPE: string
                EXAMPLE_INTERCEPTOR: string
              }
            }
          }
        }
        typings: {
          FOLDER: string

          get NAME(): string
          files: {
            EXAMPLE: string
            EXAMPLE_EXPORTED: string
          }
        }
        utils: {
          FOLDER: string

          get NAME(): string
          files: {
            EXAMPLE: string
          }
        }
      }
    }
    zanix: {
      FOLDER: string

      get NAME(): string
      files: {
        CONFIG: string
        SECRETS: string
      }
    }
  }
}
