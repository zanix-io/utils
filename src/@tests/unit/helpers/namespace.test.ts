import { assert, assertEquals, assertStrictEquals } from '@std/assert'
import { stub } from '@std/testing/mock'
import { canUseZnx, getGlobalZnx, setGlobalZnx } from 'modules/helpers/zanix/namespace.ts'

Deno.test('getGlobalZnx returns the Znx namespace once it is defined', () => {
  assertEquals(canUseZnx(), false)
  assertEquals(getGlobalZnx(), undefined)

  setGlobalZnx({ config: {} })

  assert(canUseZnx())
  assertStrictEquals(getGlobalZnx(), Znx)
})

Deno.test('setGlobalZnx ignores a broken config file when initializing Znx', () => {
  const readTextFileSyncStub = stub(Deno, 'readTextFileSync', () => {
    throw new Error('boom')
  })

  try {
    setGlobalZnx({ config: {} })
  } finally {
    readTextFileSyncStub.restore()
  }

  assert(canUseZnx())
  assertEquals(Znx.config, {})
})
