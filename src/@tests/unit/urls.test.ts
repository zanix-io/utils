import { searchParamsPropertyDescriptor } from 'utils/urls.ts'
import { assertEquals } from '@std/assert'

Deno.test('computedSearchParams should process urlsearch params', () => {
  const context = { _computedSearch: null }
  //For simple key-value pairs
  const paramsKV = new URLSearchParams('?keyA=a&keyB=b')
  const processedKV = searchParamsPropertyDescriptor(paramsKV).get?.call(context)

  assertEquals(processedKV, { keyA: 'a', keyB: 'b' })
  assertEquals(context._computedSearch, processedKV)

  //For duplicate keys
  context._computedSearch = null
  const paramsDuplicates = new URLSearchParams('?keyA=a&keyA=b')
  const processedDuplicates = searchParamsPropertyDescriptor(paramsDuplicates).get?.call(context)

  assertEquals(processedDuplicates, { keyA: ['a', 'b'] })
  assertEquals(context._computedSearch, processedDuplicates)

  //For nested structures
  context._computedSearch = null
  const nestedParams = new URLSearchParams(
    'keyA[subKeyA]=a&keyA[subKeyB]=b&keyB[subKeyA]=c&keyB[subKeyB]=d',
  )
  const processedNested = searchParamsPropertyDescriptor(nestedParams).get?.call(context)
  assertEquals(processedNested, {
    keyA: { subKeyA: 'a', subKeyB: 'b' },
    keyB: { subKeyA: 'c', subKeyB: 'd' },
  })

  //For mixed structures
  context._computedSearch = null
  const mixedParams = new URLSearchParams(
    'keyA[subKeyA]=a&keyA[subKeyB]=b&keyB[subKeyA]=c&keyB[subKeyB]=d&keyA=0',
  )
  const processedMixed = searchParamsPropertyDescriptor(mixedParams).get?.call(context)
  assertEquals(processedMixed, {
    keyA: { '0': '0', subKeyA: 'a', subKeyB: 'b' },
    keyB: { subKeyA: 'c', subKeyB: 'd' },
  }) // KeyA should not be rewrited

  context._computedSearch = null
  const mixedParams2 = new URLSearchParams(
    `keyA=0&keyA[subKeyAA]=a&keyA[subKeyAB]=b&keyB[subKeyBA]=c&keyB[subKeyBB]=d&keyB[subKeyBB]=ef&keyB[subKeyBB][subKeyBF]=d&keyB[subKeyBB][subKeyBF]=ef&keyB[subKeyBB][subKeyBE]=e`,
  )
  const processedMixed2 = searchParamsPropertyDescriptor(mixedParams2).get?.call(context)
  assertEquals(processedMixed2, {
    keyA: { '0': '0', subKeyAA: 'a', subKeyAB: 'b' },
    keyB: {
      subKeyBA: 'c',
      subKeyBB: { '0': 'd', '1': 'ef', subKeyBF: ['d', 'ef'], subKeyBE: 'e' },
    },
  })

  context._computedSearch = null
  const mixedParams3 = new URLSearchParams(
    `keyA[subKeyAA]=a&keyA[subKeyAB]=b&keyB[subKeyBA]=c&keyB[subKeyBB]=d&keyB[subKeyBB]=ef&keyB[subKeyBB][subKeyBF]=d&keyB[subKeyBB][subKeyBF]=ef&keyB[subKeyBB][subKeyBE]=e&keyA=0`,
  )
  const processedMixed3 = searchParamsPropertyDescriptor(mixedParams3).get?.call(context)
  assertEquals(processedMixed3, {
    keyA: { '0': '0', subKeyAA: 'a', subKeyAB: 'b' },
    keyB: {
      subKeyBA: 'c',
      subKeyBB: { '0': 'd', '1': 'ef', subKeyBF: ['d', 'ef'], subKeyBE: 'e' },
    },
  })
})
