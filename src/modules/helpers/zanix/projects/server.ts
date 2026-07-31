import type { ZanixServerSrcTree } from 'typings/zanix.ts'

import { ZanixTree } from 'modules/helpers/zanix/base-tree.ts'
import { join } from '@std/path'

let serverTree: ZanixServerSrcTree | undefined

// Each template's `jsr` must match the library that actually owns the API it demonstrates, not
// just the folder it happens to live in. Otherwise, a template that imports another library's API
// (e.g. `registerModel` from `@zanix/datamaster` or `registerCronJob` from `@zanix/asyncmq`)
// creates a circular dependency if `@zanix/server` claims ownership of that content, since both of
// those libraries depend on `@zanix/server`, never the other way around.
//
// A second constraint: templates that reference each other through a *relative* (intra-project)
// import must remain co-located under the SAME owning library, since each library's
// `src/templates/` is only valid as a standalone directory within its own repository. The RTO
// example imports `@zanix/validator` (a subpath of `@zanix/utils`), but the handler/interactor
// templates below reference it through a relative path. Moving it under `@zanix/utils` breaks both
// directions: `@zanix/utils` has no self-referential import mapping for its own
// `@zanix/validator` subpath, and the server's interactor/handler templates cannot resolve the
// sibling file.
//
// `@zanix/utils` sits below `@zanix/server` in the dependency graph (`server` depends on `utils`,
// never the other way around), so keeping the RTO under `@zanix/server` alongside its
// relative-path consumers poses no circular dependency risk, unlike `@zanix/asyncmq` and
// `@zanix/datamaster`, which depend on `@zanix/server`.
const jsr = '@zanix/server'

export const getServerSrcTree = (root: string): ZanixServerSrcTree => {
  const startingPoint = join(root, 'src/server')
  if (serverTree?.FOLDER === startingPoint) return serverTree

  serverTree = ZanixTree.create<ZanixServerSrcTree>({ startingPoint, baseRoot: root }, {
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
        subfolders: {
          rtos: { templates: { base: { files: ['example.rto.ts'], jsr } } },
        },
      },
      interactors: { templates: { base: { files: ['service.interactor.ts'], jsr } } },
      // Uses `registerCronJob`, owned by `@zanix/asyncmq` — server has no job-registration API.
      jobs: { templates: { base: { files: ['job.defs.ts'], jsr: '@zanix/asyncmq' } } },
      repositories: {
        // Uses `registerModel`, owned by `@zanix/datamaster` — server has no schema/model API.
        templates: { base: { files: ['model.defs.ts'], jsr: '@zanix/datamaster' } },
        subfolders: {
          seeders: {
            templates: { base: { files: ['seeder.ts'], jsr: '@zanix/datamaster' } },
          },
        },
      },
    },
  })

  return serverTree
}
