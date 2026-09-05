import { assertEquals, assertThrows } from '@std/assert'

import { assertDenoRuntime, assertRuntimeAvailable, isDenoRuntime } from 'utils/runtime.ts'

Deno.test('isDenoRuntime returns true under a real Deno process (this test itself)', () => {
  assertEquals(isDenoRuntime(), true)
})

Deno.test('assertRuntimeAvailable is a no-op when isDeno is true', () => {
  assertRuntimeAvailable('someHelper', true)
})

// `assertRuntimeAvailable` takes `isDeno` as an explicit parameter — not `typeof Deno ===
// 'undefined'` read internally — specifically so the browser/no-Deno branch is testable without
// needing to undefine the real `Deno` global mid-suite (not possible/safe to do; see
// `modules/logger/base.ts`'s own `buildHeaderLog`/`baseHeaderLog` split for the same reasoning).
Deno.test(
  'assertRuntimeAvailable throws a clear, actionable message — not a bare ReferenceError — when isDeno is false',
  () => {
    assertThrows(
      () => assertRuntimeAvailable('getRootDir', false),
      Error,
      "'getRootDir' requires a Deno runtime",
    )
  },
)

Deno.test('assertDenoRuntime delegates to assertRuntimeAvailable using the real isDenoRuntime() result', () => {
  // Real Deno process (this test), so this must never throw.
  assertDenoRuntime('readConfig')
})
