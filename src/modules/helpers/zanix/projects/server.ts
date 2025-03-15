import type { ZanixServerSrcTree } from 'typings/zanix.ts'

import { ZanixTree } from 'modules/helpers/zanix/base-tree.ts'
import { join } from '@std/path'

let serverTree: ZanixServerSrcTree | undefined

const jsr = '@zanix/server'

export const getServerSrcTree = (root: string): ZanixServerSrcTree => {
  const mainRoot = join(root, 'src/server')
  if (serverTree?.FOLDER === mainRoot) return serverTree

  return ZanixTree.create<ZanixServerSrcTree>(mainRoot, {
    subfolders: {
      connectors: {
        templates: { base: { files: ['example.provider.ts', 'example.client.ts'], jsr } },
      },
      handlers: {
        templates: {
          base: {
            files: ['example.controller.ts', 'example.resolver.ts', 'example.subscriber.ts'],
            jsr,
          },
        },
        subfolders: { rtos: { templates: { base: { files: ['example.rto.ts'], jsr } } } },
      },
      interactors: { templates: { base: { files: ['example.service.ts'], jsr } } },
      jobs: { templates: { base: { files: ['example.job.ts'], jsr } } },
      repositories: {
        templates: { base: { files: ['example.data.ts', 'example.model.ts'], jsr } },
        subfolders: { seeders: { templates: { base: { files: ['example.seeder.ts'], jsr } } } },
      },
    },
  })
}
