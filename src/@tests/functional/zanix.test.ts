import { getAllZanixLibrariesInfo, getLatestRelease } from '../../modules/helpers/zanix/info.ts'
import { versionRegex } from 'utils/regex.ts'
import { assertMatch } from '@std/assert/assert-match'
import { getZanixPaths } from 'modules/helpers/zanix/tree.ts'
import { assert } from '@std/assert'

Deno.test('Fetching Zanix lates version validation', async () => {
  const result = await getLatestRelease('utils')
  assertMatch(result, versionRegex)
})

Deno.test('Fetching Zanix lates release validation', async () => {
  const result = await getAllZanixLibrariesInfo()

  assertMatch(result['@zanix/utils'].version, versionRegex)
  assertMatch(result['@zanix/app'].version, versionRegex)
  assertMatch(result['@zanix/asyncmq'].version, versionRegex)
  assertMatch(result['@zanix/auth'].version, versionRegex)
  assertMatch(result['@zanix/core'].version, versionRegex)
  assertMatch(result['@zanix/datamaster'].version, versionRegex)
  assertMatch(result['@zanix/server'].version, versionRegex)
  assertMatch(result['@zanix/tasker'].version, versionRegex)
})

Deno.test('getZanixPaths should return correct default content from jsr', async () => {
  const paths = getZanixPaths('library', '')

  const contentUtils = await paths.subfolders.src.subfolders.utils.templates.base[0].content({
    metaUrl: import.meta.url,
  })

  assert(contentUtils.includes('Utilities Module Template'))

  const contentMod = await paths.templates.base[1].content({
    metaUrl: import.meta.url,
  })

  assert(contentMod.includes('Module Template'))

  const contentSecondaryMod = await paths.subfolders.src.subfolders.modules.templates.base[0]
    .content({
      metaUrl: import.meta.url,
    })

  assert(contentSecondaryMod.includes('export default module'))

  const contentLicense = await paths.subfolders.docs.templates.base[1].content({
    metaUrl: import.meta.url,
  })

  assert(contentLicense.includes('License'))
})
