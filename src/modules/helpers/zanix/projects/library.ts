import type { ZanixLibrarySrcTree } from 'typings/zanix.ts'

import { ZanixTree } from 'modules/helpers/zanix/base-tree.ts'
import { MAIN_MODULE } from 'utils/constants.ts'
import { join } from '@std/path'

export const getLibrarySrcTree = (root: string): ZanixLibrarySrcTree => {
  const startingPoint = join(root, 'src/modules')

  return ZanixTree.create<ZanixLibrarySrcTree>({ startingPoint, baseRoot: root }, {
    templates: { base: { files: [MAIN_MODULE], jsr: '@zanix/utils' } },
  })
}
