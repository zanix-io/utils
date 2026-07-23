import { assertStrictEquals } from '@std/assert'
import { getAppSrcTree } from 'modules/helpers/zanix/projects/app.ts'
import { getServerSrcTree } from 'modules/helpers/zanix/projects/server.ts'
import { getCommonTree } from 'modules/helpers/zanix/projects/commons.ts'

Deno.test('getAppSrcTree returns the cached tree on a second call with the same root', () => {
  const first = getAppSrcTree('cache-test-root')
  const second = getAppSrcTree('cache-test-root')

  assertStrictEquals(second, first)
})

Deno.test('getServerSrcTree returns the cached tree on a second call with the same root', () => {
  const first = getServerSrcTree('cache-test-root')
  const second = getServerSrcTree('cache-test-root')

  assertStrictEquals(second, first)
})

Deno.test('getCommonTree returns the cached tree on a second call with the same root', () => {
  const first = getCommonTree('cache-test-root')
  const second = getCommonTree('cache-test-root')

  assertStrictEquals(second, first)
})
