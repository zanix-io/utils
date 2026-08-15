import { assertEquals } from '@std/assert'
import { stub } from '@std/testing/mock'
import { hardMask, hardUnmask } from 'modules/helpers/masking/hard.ts'
import { baseMask, MASKING_SEPARATOR } from 'modules/helpers/masking/base.ts'

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

Deno.test('baseMask adds additionalInfo when masked length changes', () => {
  const result = baseMask(
    'secret',
    () => '***',
    {
      startAfter: 1,
    },
  )

  assertEquals(
    result,
    `6${MASKING_SEPARATOR}s***`,
  )
})

Deno.test('baseMask recovers when masking throws', () => {
  let called = 0

  const result = baseMask(
    'secret',
    (value) => {
      called++

      if (called === 1) {
        throw new Error('first call fails')
      }

      return value
    },
  )

  assertEquals(result, 'secret')
})

Deno.test('baseMask uses string startAfter', () => {
  const result = baseMask(
    'hello-world',
    (value) => `[${value}]`,
    {
      startAfter: '-',
    } as never,
  )

  assertEquals(
    result,
    `11${MASKING_SEPARATOR}hello-[world]`,
  )
})

Deno.test('baseMask recovers when partial masking fails', () => {
  const result = baseMask(
    'secret',
    (value) => {
      if (value !== 'secret') {
        throw new Error('partial failed')
      }

      return 'MASKED'
    },
    {
      startAfter: 1,
    },
  )

  assertEquals(result, 'MASKED')
})

Deno.test('baseMask returns original input when masking fails completely', () => {
  const result = baseMask(
    'secret',
    () => {
      throw new Error('always fails')
    },
    {
      startAfter: 1,
    },
  )

  assertEquals(result, 'secret')
})
