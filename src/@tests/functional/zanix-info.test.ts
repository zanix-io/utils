import { getAllZanixLibrariesInfo, getLatestRelease } from '../../modules/helpers/zanix/info.ts'
import { versionRegex } from 'utils/regex.ts'
import { assertMatch } from '@std/assert/assert-match'
//import { getZanixPaths } from 'modules/helpers/zanix/tree.ts'
//import { assert } from '@std/assert'

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
/*
// TODO: habilite when remove alpha
Deno.test('getZanixPaths should return correct constants content from jsr', async () => {
  const paths = getZanixPaths('library', '')

  paths.subfolders.src.subfolders.utils.templates.base[0].PATH = '/src/utils/constants.ts'
  const _content = await paths.subfolders.src.subfolders.utils.templates.base[0].content({
    metaUrl: import.meta.url,
  })
  // TODO: habilite when remove alpha
  assert(content !== '')
  //assert(content.includes('ZANIX_LOGO'))
})*/
