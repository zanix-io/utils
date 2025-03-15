import type { ZanixServerSrcTree } from 'typings/zanix.ts'

import { ZanixTree } from 'modules/helpers/zanix/base-tree.ts'
import { join } from '@std/path'

let serverTree: ZanixServerSrcTree | undefined

const library = '@zanix/server'

export const getServerSrcTree = (root: string): ZanixServerSrcTree => {
  const mainRoot = join(root, 'src/server')
  if (serverTree?.FOLDER === mainRoot) return serverTree

  return ZanixTree.create<ZanixServerSrcTree>(mainRoot, {
    subfolders: {
      connectors: {
        templates: { base: { files: ['example.provider.ts', 'example.client.ts'], library } },
      },
      handlers: {
        templates: {
          base: {
            files: ['example.controller.ts', 'example.resolver.ts', 'example.subscriber.ts'],
            library,
          },
        },
        subfolders: { rtos: { templates: { base: { files: ['example.rto.ts'], library } } } },
      },
      interactors: { templates: { base: { files: ['example.service.ts'], library } } },
      jobs: { templates: { base: { files: ['example.job.ts'], library } } },
      repositories: {
        templates: { base: { files: ['example.data.ts', 'example.model.ts'], library } },
        subfolders: { seeders: { templates: { base: { files: ['example.seeder.ts'], library } } } },
      },
    },
  })
}
