import { getAllZanixLibrariesInfo } from '../../modules/helpers/zanix/info.ts'
import { versionRegex } from 'utils/regex.ts'
import { assertMatch } from '@std/assert/assert-match'

Deno.test('Fetching Zanix lates version validation', async () => {
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
