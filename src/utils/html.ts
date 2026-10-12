const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
}

/**
 * Escapes the characters that mean something in HTML (`&`, `<`, `>`, `"` and `'`), so a value can sit
 * in a text node or inside a quoted attribute without being read as markup. The module has no
 * imports, so it is safe to load in a browser or in a worker.
 *
 * @example
 * ```ts
 * escapeHtml(`<b onclick="x()">O'Neil & Sons</b>`)
 * // '&lt;b onclick=&quot;x()&quot;&gt;O&#x27;Neil &amp; Sons&lt;/b&gt;'
 * ```
 *
 * @param value The text to escape.
 * @returns `value` with its special characters replaced by their entities.
 *
 * @category helpers
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])
}
