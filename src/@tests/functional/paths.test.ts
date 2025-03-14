import { getPathFromCurrent } from 'modules/helpers/paths.ts'
import { assert, assertExists } from '@std/assert'

Deno.test('getPathFromCurrent should return a path relative to the executing script', () => {
  assert(getPathFromCurrent(import.meta.url, 'test.ts').startsWith(Deno.cwd()))
  assert(getPathFromCurrent(import.meta.url, './script/test.ts').endsWith('/script/test.ts'))
  assert(getPathFromCurrent(import.meta.url, '') !== import.meta.url)

  assertExists(
    getPathFromCurrent(
      'https://jsr.io/@zanix/utils/1.1.0/src/modules/helpers/github/hooks/scripts/pre-commit.base.sh',
      '',
    ),
  )
})
