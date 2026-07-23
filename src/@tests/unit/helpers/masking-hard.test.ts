import { assertEquals } from '@std/assert'
import { stub } from '@std/testing/mock'
import { hardMask, hardUnmask } from 'modules/helpers/masking/hard.ts'

Deno.test('hardMask repeats the mask character for the input length', () => {
  const consoleWarn = stub(console, 'warn')

  try {
    assertEquals(hardMask('hello', '*'), '*****')
  } finally {
    consoleWarn.restore()
  }
})

Deno.test('hardMask warns and uses only the first char when the mask has more than one', () => {
  const consoleWarn = stub(console, 'warn')

  try {
    assertEquals(hardMask('hello', 'ab'), 'aaaaa')
    assertEquals(consoleWarn.calls.length, 1)
  } finally {
    consoleWarn.restore()
  }
})

Deno.test('hardUnmask warns and returns the value unchanged', () => {
  const consoleWarn = stub(console, 'warn')

  try {
    assertEquals(hardUnmask('*****', '*'), '*****')
    assertEquals(consoleWarn.calls.length, 1)
  } finally {
    consoleWarn.restore()
  }
})
