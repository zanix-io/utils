import type { ZanixServerSrcTree } from 'typings/zanix.ts'

import { getFolderName } from 'modules/helpers/paths.ts'
import zanixLibInfo from '../info.ts'

let serverTree: ZanixServerSrcTree | undefined

const serverLib = '@zanix/server' as const
const taskerLib = '@zanix/tasker' as const
const dataLib = '@zanix/datamaster' as const
const mqLib = '@zanix/asyncmq' as const

export const getServerFolders = (root: string): ZanixServerSrcTree => {
  const mainFolder = `${root}/src/server`
  if (serverTree?.FOLDER === mainFolder) return serverTree

  return {
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
        templates: {
          base: [{
            PATH: `${root}/src/server/contectors/example.provider.ts`,
            content(local) {
              const opts = { local, root, path: this.PATH, library: serverLib }
              return zanixLibInfo.templateContent(opts)
            },
          }, {
            PATH: `${root}/src/server/contectors/example.client.ts`,
            content(local) {
              const opts = { local, root, path: this.PATH, library: serverLib }
              return zanixLibInfo.templateContent(opts)
            },
          }],
        },
      },
      handlers: {
        FOLDER: `${root}/src/server/handlers`,
        get NAME() {
          return getFolderName(this.FOLDER)
        },
        templates: {
          base: [
            {
              PATH: `${root}/src/server/handlers/example.controller.ts`,
              content(local) {
                const opts = { local, root, path: this.PATH, library: serverLib }
                return zanixLibInfo.templateContent(opts)
              },
            },
            {
              PATH: `${root}/src/server/handlers/example.resolver.ts`,
              content(local) {
                const opts = { local, root, path: this.PATH, library: serverLib }
                return zanixLibInfo.templateContent(opts)
              },
            },
            {
              PATH: `${root}/src/server/handlers/example.subscriber.ts`,
              content(local) {
                const opts = { local, root, path: this.PATH, library: mqLib }
                return zanixLibInfo.templateContent(opts)
              },
            },
          ],
        },
        subfolders: {
          rtos: {
            FOLDER: `${root}/src/server/handlers/rtos`,
            get NAME() {
              return getFolderName(this.FOLDER)
            },
            templates: {
              base: [{
                PATH: `${root}/src/server/handlers/rtos/example.rto.ts`,
                content(local) {
                  const opts = { local, root, path: this.PATH, library: serverLib }
                  return zanixLibInfo.templateContent(opts)
                },
              }],
            },
          },
        },
      },
      interactors: {
        FOLDER: `${root}/src/server/interactors`,
        get NAME() {
          return getFolderName(this.FOLDER)
        },
        templates: {
          base: [{
            PATH: `${root}/src/server/interactors/example.service.ts`,
            content(local) {
              const opts = { local, root, path: this.PATH, library: serverLib }
              return zanixLibInfo.templateContent(opts)
            },
          }],
        },
      },
      jobs: {
        FOLDER: `${root}/src/server/jobs`,
        get NAME() {
          return getFolderName(this.FOLDER)
        },
        templates: {
          base: [{
            PATH: `${root}/src/server/jobs/example.job.ts`,
            content(local) {
              const opts = { local, root, path: this.PATH, library: taskerLib }
              return zanixLibInfo.templateContent(opts)
            },
          }],
        },
      },
      repositories: {
        FOLDER: `${root}/src/server/repositories`,
        get NAME() {
          return getFolderName(this.FOLDER)
        },
        templates: {
          base: [{
            PATH: `${root}/src/server/repositories/example.data.ts`,
            content(local) {
              const opts = { local, root, path: this.PATH, library: dataLib }
              return zanixLibInfo.templateContent(opts)
            },
          }, {
            PATH: `${root}/src/server/repositories/example.model.ts`,
            content(local) {
              const opts = { local, root, path: this.PATH, library: dataLib }
              return zanixLibInfo.templateContent(opts)
            },
          }],
        },
        subfolders: {
          seeders: {
            FOLDER: `${root}/src/server/repositories/seeders`,
            get NAME() {
              return getFolderName(this.FOLDER)
            },
            templates: {
              base: [{
                PATH: `${root}/src/server/repositories/seeders/example.seeder.ts`,
                content(local) {
                  const opts = { local, root, path: this.PATH, library: dataLib }
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
