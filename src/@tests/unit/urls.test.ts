import {
  getProcessedParams,
  interpolateUrl,
  searchParamsPropertyDescriptor,
  toSearchParams,
  verifyUrl,
} from 'utils/urls.ts'
import { assertEquals, assertStrictEquals } from '@std/assert'

Deno.test('verifyUrl - parses valid URLs and returns undefined for invalid ones', () => {
  const url = verifyUrl('http://www.zanix.co')

  assertEquals(url?.hostname, 'www.zanix.co')
  assertEquals(verifyUrl('not-a-valid-url'), undefined)
})

Deno.test({
  name: 'searchParamsPropertyDescriptor - caches the processed value and allows overriding it',
  fn: () => {
    const context: { _computedSearch: unknown } = { _computedSearch: null }
    const descriptor = searchParamsPropertyDescriptor(new URLSearchParams('?keyA=a'))

    const firstAccess = descriptor.get?.call(context)
    const secondAccess = descriptor.get?.call(context) // should hit the cached value, not reprocess

    assertStrictEquals(firstAccess, secondAccess)

    descriptor.set?.call(context, { keyA: 'overridden' })
    assertEquals(context._computedSearch, { keyA: 'overridden' })
    assertStrictEquals(descriptor.get?.call(context), context._computedSearch)
  },
})

Deno.test('getProcessedParams - simple key-value pairs', () => {
  const searchParams = new URLSearchParams('?keyA=a&keyB=b')
  const result = getProcessedParams(searchParams)

  assertEquals(result, { keyA: 'a', keyB: 'b' })
})

Deno.test('getProcessedParams - duplicate keys', () => {
  const searchParams = new URLSearchParams('?keyA=a&keyA=b')
  const result = getProcessedParams(searchParams)

  assertEquals(result, { keyA: ['a', 'b'] })
})

Deno.test('getProcessedParams - nested key structure', () => {
  const searchParams = new URLSearchParams(
    'keyA[subKeyA]=a&keyA[subKeyB]=b&keyB[subKeyA]=c&keyB[subKeyB]=d',
  )
  const result = getProcessedParams(searchParams)

  assertEquals(result, {
    keyA: { subKeyA: 'a', subKeyB: 'b' },
    keyB: { subKeyA: 'c', subKeyB: 'd' },
  })
})

Deno.test('getProcessedParams - handles empty params', () => {
  const searchParams = new URLSearchParams('')
  const result = getProcessedParams(searchParams)

  assertEquals(result, {})
})

Deno.test('getProcessedParams - single nested key', () => {
  const searchParams = new URLSearchParams('keyA[subKeyA]=a')
  const result = getProcessedParams(searchParams)

  assertEquals(result, { keyA: { subKeyA: 'a' } })
})

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

Deno.test('toSearchParams - simple key-value pairs', () => {
  const params = toSearchParams({ keyA: 'a', keyB: 'b' })
  assertEquals(params.toString(), 'keyA=a&keyB=b')
})

Deno.test('toSearchParams - array values become duplicate keys', () => {
  const params = toSearchParams({ keyA: ['a', 'b'] })
  assertEquals(params.toString(), 'keyA=a&keyA=b')
})

Deno.test('toSearchParams - nested objects use bracket notation', () => {
  const params = toSearchParams({ keyA: { subKeyA: 'a', subKeyB: 'b' } })
  assertEquals(params.get('keyA[subKeyA]'), 'a')
  assertEquals(params.get('keyA[subKeyB]'), 'b')
})

Deno.test('toSearchParams - skips null/undefined values entirely', () => {
  const params = toSearchParams({ keyA: 'a', keyB: null, keyC: undefined })
  assertEquals(params.toString(), 'keyA=a')
})

Deno.test('toSearchParams - non-string primitives are stringified', () => {
  const params = toSearchParams({ amount: 42, active: false })
  assertEquals(params.get('amount'), '42')
  assertEquals(params.get('active'), 'false')
})

Deno.test('toSearchParams round-trips with getProcessedParams for simple pairs', () => {
  const built = toSearchParams({ keyA: 'a', keyB: 'b' })
  assertEquals(getProcessedParams(new URLSearchParams(built.toString())), {
    keyA: 'a',
    keyB: 'b',
  })
})

Deno.test('toSearchParams round-trips with getProcessedParams for arrays', () => {
  const built = toSearchParams({ keyA: ['a', 'b'] })
  assertEquals(getProcessedParams(new URLSearchParams(built.toString())), {
    keyA: ['a', 'b'],
  })
})

Deno.test('toSearchParams round-trips with getProcessedParams for nested objects', () => {
  const built = toSearchParams({ keyA: { subKeyA: 'a', subKeyB: 'b' } })
  assertEquals(getProcessedParams(new URLSearchParams(built.toString())), {
    keyA: { subKeyA: 'a', subKeyB: 'b' },
  })
})

Deno.test('interpolateUrl interpolates a URL with no query string like a plain string', () => {
  assertEquals(
    interpolateUrl('https://x.com/{{id}}', { id: '42' }),
    'https://x.com/42',
  )
})

Deno.test('interpolateUrl interpolates the path portion before the query string', () => {
  assertEquals(
    interpolateUrl('https://x.com/{{id}}?a=1', { id: '42' }),
    'https://x.com/42?a=1',
  )
})

Deno.test('interpolateUrl substitutes a mixed-text query value as a string', () => {
  assertEquals(
    interpolateUrl('https://x.com?value={{amount}}', { amount: 42 }),
    'https://x.com?value=42',
  )
})

Deno.test('interpolateUrl expands an array whole-value placeholder into repeated keys', () => {
  const result = interpolateUrl('https://x.com?tags={{tags}}', { tags: ['a', 'b', 'c'] })
  assertEquals(result, 'https://x.com?tags=a&tags=b&tags=c')
})

Deno.test('interpolateUrl expands a nested-object placeholder using bracket notation', () => {
  const result = interpolateUrl('https://x.com?address={{address}}', {
    address: { city: 'Bogotá', zip: '110111' },
  })
  assertEquals(result, 'https://x.com?address%5Bcity%5D=Bogot%C3%A1&address%5Bzip%5D=110111')
})

Deno.test('interpolateUrl keeps a simple whole-value string placeholder as a plain param', () => {
  assertEquals(
    interpolateUrl('https://x.com?email={{email}}', { email: 'a@b.com' }),
    'https://x.com?email=a%40b.com',
  )
})

Deno.test('interpolateUrl preserves multiple query params, mixing plain and array values', () => {
  const result = interpolateUrl('https://x.com?page=1&tags={{tags}}', { tags: ['a', 'b'] })
  assertEquals(result, 'https://x.com?page=1&tags=a&tags=b')
})

Deno.test('interpolateUrl interpolates the query key itself', () => {
  assertEquals(
    interpolateUrl('https://x.com?{{keyName}}=1', { keyName: 'page' }),
    'https://x.com?page=1',
  )
})

Deno.test('interpolateUrl returns just the path when the query string is empty', () => {
  assertEquals(interpolateUrl('https://x.com?', {}), 'https://x.com')
})
