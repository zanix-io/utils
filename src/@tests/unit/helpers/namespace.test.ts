import { assert, assertEquals, assertStrictEquals } from '@std/assert'
import { stub } from '@std/testing/mock'
import { canUseZnx, getGlobalZnx, setGlobalZnx } from 'modules/helpers/zanix/namespace.ts'

Deno.test('getGlobalZnx returns the Znx namespace once it is defined', () => {
  // `modules/logger/mod.ts` creates the first `Logger` instance (and thus `Znx`) as an
  // import-time side effect, and this file's own import chain pulls that module in — so `Znx`
  // may already be defined by the time this test body runs. Deleting it first keeps this test
  // self-contained, as a `unit/` test must be, instead of depending on which module happened to
  // run first.
  Reflect.deleteProperty(globalThis, 'Znx')

  assertEquals(canUseZnx(), false)
  assertEquals(getGlobalZnx(), undefined)

  setGlobalZnx({ config: {} })

  assert(canUseZnx())
  assertStrictEquals(getGlobalZnx(), Znx)
})

Deno.test('setGlobalZnx ignores a broken config file when initializing Znx', () => {
  Reflect.deleteProperty(globalThis, 'Znx')

  const readTextFileSyncStub = stub(Deno, 'readTextFileSync', () => {
    throw new Error('boom')
  })

  try {
    setGlobalZnx({ config: {} })

    assert(canUseZnx())
    // `Znx.config` resolves lazily (see `setGlobalZnx`'s own doc) — the read has to happen, and
    // fail, INSIDE this stub's window to actually exercise the ignored-error path; asserting
    // after `restore()` would instead read this repo's own real `deno.jsonc`.
    assertEquals(Znx.config, {})
  } finally {
    readTextFileSyncStub.restore()
  }
})
