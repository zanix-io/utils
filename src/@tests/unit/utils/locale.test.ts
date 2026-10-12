import { assertEquals } from 'jsr:@std/assert@^1.0.15'
import { isLangTag, parseAcceptLanguage } from 'utils/locale.ts'

Deno.test('isLangTag: accepts the tags the ecosystem uses and rejects anything else', () => {
  for (const tag of ['es', 'en', 'es-MX', 'zh-Hant-TW', 'fil', 'sr-Latn-RS']) {
    assertEquals(isLangTag(tag), true, tag)
  }
  for (
    const value of [
      '',
      'e',
      'español',
      'es_MX',
      'es-',
      '<x>',
      'es MX',
      'a'.repeat(36),
      5,
      null,
      undefined,
    ]
  ) {
    assertEquals(isLangTag(value), false, String(value))
  }
})

Deno.test('parseAcceptLanguage: orders by q, keeps ties in written order', () => {
  assertEquals(parseAcceptLanguage('es-MX,es;q=0.9,en;q=0.8'), ['es-MX', 'es', 'en'])
  assertEquals(parseAcceptLanguage('en;q=0.5, es;q=0.9'), ['es', 'en'])
  assertEquals(parseAcceptLanguage('de, fr'), ['de', 'fr'])
  assertEquals(parseAcceptLanguage('en;Q=0.2, es;q=0.7'), ['es', 'en'])
})

Deno.test('parseAcceptLanguage: leaves out a wildcard, q=0, a malformed tag and a bad q', () => {
  assertEquals(parseAcceptLanguage('*, <script>, fr;q=0, de'), ['de'])
  assertEquals(parseAcceptLanguage('en;q=abc, es'), ['es'])
  assertEquals(parseAcceptLanguage('*'), [])
})

Deno.test('parseAcceptLanguage: nothing to read gives an empty list', () => {
  for (const header of [null, undefined, '', '   ']) assertEquals(parseAcceptLanguage(header), [])
})
