import { assert, assertEquals } from '@std/assert'
import { getZanixPaths } from 'modules/helpers/zanix/tree.ts'

Deno.test(
  'getZanixPaths should return correct folder and content tree wihtout root uri',
  async () => {
    const paths = getZanixPaths('library', '')

    const content = await paths.templates.base[0].content({
      metaUrl: import.meta.url,
      relativePath: '../../../',
    })

    assert(content !== '')

    assertEquals(paths.FOLDER, '/')
  },
)
