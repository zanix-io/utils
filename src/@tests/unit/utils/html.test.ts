import { assertEquals } from 'jsr:@std/assert@^1.0.15'
import { escapeHtml } from 'utils/html.ts'

Deno.test('escapeHtml: escapes the five characters that mean something in HTML', () => {
  assertEquals(
    escapeHtml(`<b onclick="x()">O'Neil & Sons</b>`),
    '&lt;b onclick=&quot;x()&quot;&gt;O&#x27;Neil &amp; Sons&lt;/b&gt;',
  )
})

Deno.test('escapeHtml: escapes the ampersand first, so an entity is not escaped twice by the others', () => {
  assertEquals(escapeHtml('&lt;'), '&amp;lt;')
  assertEquals(escapeHtml('a < b'), 'a &lt; b')
})

Deno.test('escapeHtml: text with nothing to escape, and the empty text, come back as they are', () => {
  assertEquals(escapeHtml('Hola, mundo 123'), 'Hola, mundo 123')
  assertEquals(escapeHtml(''), '')
})
