import { getConfigDir, getRootDir } from 'modules/helpers/paths.ts'
import { getFolderName } from 'modules/helpers/mod.ts'
import { app } from './app.ts'
import { library } from './library.ts'
import { server } from './server.ts'

const root = `${getRootDir()}/`

/**
 * Zanix folders object structure
 */
export const ZNX_STRUCT = {
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
} as const
