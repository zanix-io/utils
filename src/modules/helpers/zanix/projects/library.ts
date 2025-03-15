import type { ZanixLibrarySrcTree } from 'typings/zanix.ts'

import { ZanixTree } from 'modules/helpers/zanix/base-tree.ts'
import { join } from '@std/path'

export const getLibrarySrcTree = (root: string): ZanixLibrarySrcTree => {
  const mainRoot = join(root, 'src/modules')

  return ZanixTree.create<ZanixLibrarySrcTree>(mainRoot, {
    templates: { base: { files: ['mod.ts'] } },
  })
}
