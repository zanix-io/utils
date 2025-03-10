import { assertEquals } from '@std/assert/assert-equals'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'

Deno.test('Validates the default lint message formatter', () => {
  const formatter = linterMessageFormat('test this message')
  assertEquals(formatter, '❌ test this message')
})
