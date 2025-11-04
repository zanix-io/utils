import { assert, assertEquals, assertNotEquals } from '@std/assert'
import { mask, unmask } from 'modules/helpers/masking/mod.ts'
import { MASKING_SEPARATOR, ZANIX_PREFIX } from 'modules/helpers/masking/base.ts'
import { stub } from '@std/testing/mock'

const separator = MASKING_SEPARATOR
const pref = ZANIX_PREFIX

stub(console, 'warn')

Deno.test('Masking and unmasking should works', () => {
  const key = '$$c0e3053bd41a8005aa719657786945f'

  const input = 'my input'
  const masked = mask(input, key)
  const unmasked = unmask(masked, key)

  assert(masked !== unmasked)
  assertEquals(unmasked, input)

  const inputs = ['my input 1', 'my input 2']

  const maskedArray = mask(inputs, key)
  const unmaskedArray = unmask(maskedArray, key)

  assert(maskedArray.join(',') !== unmaskedArray.join(','))

  assertEquals(unmaskedArray, inputs)
})

Deno.test('Unmasking only masked values check', () => {
  const key = 'my secret key'

  const input = 'my input'
  const unmasked = unmask(input, key)

  assertEquals(unmasked, input)
})

Deno.test('Irreversible masking should works', () => {
  const key = '$$c0e3053bd41a8005aa719657786945f'

  const input = 'my input'
  const masked = mask(input, key, { algorithm: 'hard' })
  const unmasked = unmask(masked, key)

  assertEquals(masked, '$$$$$$$$')
  assertNotEquals(unmasked, input)

  const masked2 = mask(input, '*', { algorithm: 'hard' })
  assertEquals(masked2, '********')

  const masked3 = mask(input, '*', { algorithm: 'hard', endBefore: 4 })
  assertEquals(masked3, '****nput')

  const masked4 = mask(input, '*', { algorithm: 'hard', startAfter: 3 })
  assertEquals(masked4, 'my *****')

  const masked5 = mask(input, '*', { algorithm: 'hard', startAfter: 4, endBefore: 2 })
  assertEquals(masked5, 'my i**ut')
})

Deno.test('Masking and unmasking should works with index test cases', () => {
  const key = 'c0e3053bd41a8005aa719657786945f'

  const input = 'my+input'

  const testCasesWithIndex = [
    { input, startAfter: -1, endBefore: -2, expected: `${pref}0e494e5a5e454616` },
    { input, startAfter: -10, endBefore: 0, expected: `${pref}0e494e5a5e454616` },
    { input, startAfter: -1, expected: `${pref}0e494e5a5e454616` },
    { input, startAfter: 0, expected: `${pref}0e494e5a5e454616` },
    { input, endBefore: 0, expected: `${pref}0e494e5a5e454616` },
    { input, startAfter: 12, expected: `${pref}0e494e5a5e454616` },
    { input, startAfter: 10, endBefore: 12, expected: `${pref}0e494e5a5e454616` },
    { input, startAfter: 1, endBefore: 1, expected: `8${separator}m${pref}1a1b0c5d4040t` },
    { input, startAfter: 1, expected: `8${separator}m${pref}1a1b0c5d404047` },
    { input, startAfter: 1, endBefore: 2, expected: `8${separator}m${pref}1a1b0c5d40ut` },
    { input: 'masks', startAfter: 0, endBefore: 0, expected: `${pref}0e51165843` },
    { input: 'masks', startAfter: 0, endBefore: 1, expected: `5${separator}${pref}0e511658s` },
    { input: 'masks', startAfter: 0, endBefore: 2, expected: `5${separator}${pref}0e5116ks` },
    { input: 'masks', startAfter: 0, endBefore: 3, expected: `5${separator}${pref}0e51sks` },
    { input: 'masks', startAfter: 0, endBefore: 4, expected: `5${separator}${pref}0easks` },
    { input: 'masks', startAfter: 0, endBefore: 5, expected: `${pref}0e51165843` },
    { input: 'masks', startAfter: 1, endBefore: 0, expected: `5${separator}m${pref}02430e40` },
    { input: 'masks', startAfter: 1, endBefore: 1, expected: `5${separator}m${pref}02430es` },
    { input: 'masks', startAfter: 1, endBefore: 2, expected: `5${separator}m${pref}0243ks` },
    { input: 'masks', startAfter: 1, endBefore: 3, expected: `5${separator}m${pref}02sks` },
    { input: 'masks', startAfter: 1, endBefore: 4, expected: `${pref}0e51165843` },
    { input: 'masks', startAfter: 2, endBefore: 0, expected: `5${separator}ma${pref}105b16` },
    { input: 'masks', startAfter: 2, endBefore: 1, expected: `5${separator}ma${pref}105bs` },
    { input: 'masks', startAfter: 2, endBefore: 2, expected: `5${separator}ma${pref}10ks` },
    { input: 'masks', startAfter: 2, endBefore: 3, expected: `${pref}0e51165843` },
    { input: 'masks', startAfter: 3, endBefore: 0, expected: `5${separator}mas${pref}0843` },
    { input: 'masks', startAfter: 3, endBefore: 1, expected: `5${separator}mas${pref}08s` },
    { input: 'masks', startAfter: 3, endBefore: 2, expected: `${pref}0e51165843` },
    { input: 'masks', startAfter: 4, endBefore: 0, expected: `5${separator}mask${pref}10` },
    { input: 'masks', startAfter: 4, endBefore: 1, expected: `${pref}0e51165843` },
  ]

  testCasesWithIndex.forEach(({ input, startAfter, endBefore, expected }) => {
    assertEquals(mask(input, key, { startAfter, endBefore }), expected)
    assertEquals(unmask(expected, key, { startAfter, endBefore }), input)
  })
})

Deno.test('Masking and unmasking should works with chars test cases', () => {
  const secret = 'value'
  const testCasesChar = [
    {
      startAfter: 0,
      endBefore: '@',
      expected: `21${separator}${pref}06041c1c1119110907000c@gmail.com`,
    },
    {
      startAfter: 3,
      endBefore: '@',
      expected: `21${separator}pep${pref}1f15030500040416@gmail.com`,
    },
    { startAfter: 5, endBefore: '@', expected: `21${separator}pepit${pref}19110907000c@gmail.com` },
    { startAfter: 7, endBefore: '@', expected: `21${separator}pepitop${pref}1313090f@gmail.com` },
    { startAfter: 8, endBefore: '@', expected: `21${separator}pepitope${pref}040416@gmail.com` },
    { startAfter: 9, endBefore: '@', expected: `21${separator}pepitoper${pref}131b@gmail.com` },
    {
      startAfter: 12,
      endBefore: '@',
      expected: `21${separator}${pref}06041c1c1119110907000c@gmail.com`,
    },
    {
      startAfter: 20,
      endBefore: '@',
      expected: `21${separator}${pref}06041c1c1119110907000c@gmail.com`,
    },
    {
      startAfter: 0,
      endBefore: 'l',
      expected: `21${separator}${pref}06041c1c1119110907000c210b18041fl.com`,
    },
    { startAfter: 13, endBefore: 'l', expected: `21${separator}pepitoperez@g${pref}1b0005l.com` },
    {
      startAfter: 20,
      endBefore: 'l',
      expected: `21${separator}${pref}06041c1c1119110907000c210b18041fl.com`,
    },
    {
      startAfter: 2,
      endBefore: '*',
      expected: `21${separator}pe${pref}0608181a151313090f25110c0d1c0958020318`,
    },
    { startAfter: 18, endBefore: '*', expected: `21${separator}pepitoperez@gmail.${pref}150e01` },
    { startAfter: 19, endBefore: '*', expected: `21${separator}pepitoperez@gmail.c${pref}190c` },
    { startAfter: 23, expected: `${pref}06041c1c1119110907000c210b18041f0d42160a1b` },
  ]

  testCasesChar.forEach(({ startAfter, endBefore, expected }) => {
    assertEquals(mask('pepitoperez@gmail.com', secret, { startAfter, endBefore }), expected)
    assertEquals(unmask(expected, secret, { startAfter, endBefore }), 'pepitoperez@gmail.com')
  })
})

Deno.test('Masking and unmasking should works with array and chars test cases', () => {
  const secret = 'value'
  const input = ['pepitoperez@gmail.com', 'pepitoperez2@gmail.com']
  const testCasesChar = [
    {
      input,
      startAfter: 0,
      endBefore: '@',
      expected: [
        `21${separator}${pref}06041c1c1119110907000c@gmail.com`,
        `22${separator}${pref}06041c1c1119110907000c53@gmail.com`,
      ],
    },
    {
      input,
      startAfter: 3,
      endBefore: '@',
      expected: [
        `21${separator}pep${pref}1f15030500040416@gmail.com`,
        `22${separator}pep${pref}1f1503050004041647@gmail.com`,
      ],
    },
  ]

  testCasesChar.forEach(({ startAfter, endBefore, expected }) => {
    assertEquals(
      mask(input, secret, { startAfter, endBefore }),
      expected,
    )
    assertEquals(unmask(expected, secret, { startAfter, endBefore }), input)
  })
})
