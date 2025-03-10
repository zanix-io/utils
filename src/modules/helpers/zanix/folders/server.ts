import { getFolderName, getRootDir } from 'modules/helpers/paths.ts'

const root: string = getRootDir()

export const server: ServerFolders = {
  FOLDER: `${root}/src/server`,
  get NAME() {
    return getFolderName(this.FOLDER)
  },
  subfolders: {
    connectors: {
      FOLDER: `${root}/src/server/contectors`,
      get NAME() {
        return getFolderName(this.FOLDER)
      },
      files: {
        EXAMPLE_PROVIDER: `${root}/src/server/contectors/example.provider.ts`,
        EXAMPLE_CLIENT: `${root}/src/server/contectors/example.client.ts`,
      },
    },
    handlers: {
      FOLDER: `${root}/src/server/handlers`,
      get NAME() {
        return getFolderName(this.FOLDER)
      },
      files: {
        EXAMPLE_CONTROLLER: `${root}/src/server/handlers/example.controller.ts`,
        EXAMPLE_RESOLVER: `${root}/src/server/handlers/example.resolver.ts`,
        EXAMPLE_SUBSCRIBER: `${root}/src/server/handlers/example.subscriber.ts`,
      },
      subfolders: {
        rtos: {
          FOLDER: `${root}/src/server/handlers/rtos`,
          get NAME() {
            return getFolderName(this.FOLDER)
          },
          files: { EXAMPLE: `${root}/src/server/handlers/rtos/example.rto.ts` },
        },
      },
    },
    interactors: {
      FOLDER: `${root}/src/server/interactors`,
      get NAME() {
        return getFolderName(this.FOLDER)
      },
      files: {
        EXAMPLE_SERVICE: `${root}/src/server/interactors/example.service.ts`,
      },
    },
    jobs: {
      FOLDER: `${root}/src/server/jobs`,
      get NAME() {
        return getFolderName(this.FOLDER)
      },
      files: {
        EXAMPLE: `${root}/src/server/jobs/example.job.ts`,
      },
    },
    repositories: {
      FOLDER: `${root}/src/server/repositories`,
      get NAME() {
        return getFolderName(this.FOLDER)
      },
      files: {
        EXAMPLE_DATA: `${root}/src/server/repositories/example.data.ts`,
        EXAMPLE_MODEL: `${root}/src/server/repositories/example.model.ts`,
      },
      subfolders: {
        seeders: {
          FOLDER: `${root}/src/server/repositories/seeders`,
          get NAME() {
            return getFolderName(this.FOLDER)
          },
          files: { EXAMPLE: `${root}/src/server/repositories/seeders/example.seeder.ts` },
        },
      },
    },
  },
}

export type ServerFolders = {
  FOLDER: string
  get NAME(): string
  subfolders: {
    connectors: {
      FOLDER: string
      get NAME(): string
      files: {
        EXAMPLE_PROVIDER: string
        EXAMPLE_CLIENT: string
      }
    }
    handlers: {
      FOLDER: string
      get NAME(): string
      files: {
        EXAMPLE_CONTROLLER: string
        EXAMPLE_RESOLVER: string
        EXAMPLE_SUBSCRIBER: string
      }
      subfolders: {
        rtos: {
          FOLDER: string
          get NAME(): string
          files: { EXAMPLE: string }
        }
      }
    }
    interactors: {
      FOLDER: string
      get NAME(): string
      files: {
        EXAMPLE_SERVICE: string
      }
    }
    jobs: {
      FOLDER: string
      get NAME(): string
      files: {
        EXAMPLE: string
      }
    }
    repositories: {
      FOLDER: string
      get NAME(): string
      files: {
        EXAMPLE_DATA: string
        EXAMPLE_MODEL: string
      }
      subfolders: {
        seeders: {
          FOLDER: string
          get NAME(): string
          files: { EXAMPLE: string }
        }
      }
    }
  }
}
