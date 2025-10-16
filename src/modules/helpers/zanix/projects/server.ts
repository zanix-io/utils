import type { ZanixServerSrcTree } from 'typings/zanix.ts'

import { ZanixTree } from 'modules/helpers/zanix/base-tree.ts'
import { join } from '@std/path'

let serverTree: ZanixServerSrcTree | undefined

const jsr = '@zanix/server'

export const getServerSrcTree = (root: string): ZanixServerSrcTree => {
  const startingPoint = join(root, 'src/server')
  if (serverTree?.FOLDER === startingPoint) return serverTree

  return ZanixTree.create<ZanixServerSrcTree>({ startingPoint, baseRoot: root }, {
    subfolders: {
      connectors: {
        templates: { base: { files: ['example.connector.ts'], jsr } },
      },
      handlers: {
        templates: {
          base: {
            files: ['example.handler.ts'],
            jsr,
          },
        },
        subfolders: { rtos: { templates: { base: { files: ['example.rto.ts'], jsr } } } },
      },
      interactors: { templates: { base: { files: ['service.interactor.ts'], jsr } } },
      jobs: { templates: { base: { files: ['job.hoc.ts'], jsr } } },
      repositories: {
        templates: { base: { files: ['model.hoc.ts'], jsr } },
        subfolders: { seeders: { templates: { base: { files: ['seeder.hoc.ts'], jsr } } } },
      },
    },
  })
}
