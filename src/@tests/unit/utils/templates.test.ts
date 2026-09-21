// deno-lint-ignore-file no-explicit-any
import { assertEquals } from '@std/assert'
import {
  getPath,
  interpolate,
  interpolateEnv,
  interpolateUrl,
  matchWholePlaceholder,
} from 'utils/templates.ts'

Deno.test('getPath resolves a nested dot-path, including array indices', () => {
  assertEquals(getPath({ items: [{ name: 'a' }] }, 'items.0.name'), 'a')
  assertEquals(getPath({ a: { b: 1 } }, 'a.b'), 1)
  assertEquals(getPath({ a: null }, 'a.b'), undefined)
  assertEquals(getPath({}, 'missing.path'), undefined)
})

Deno.test({
  name: 'matchWholePlaceholder returns the field path only for an exact single placeholder',
  fn: () => {
    assertEquals(matchWholePlaceholder('{{email}}'), 'email')
    assertEquals(matchWholePlaceholder('{{address.city}}'), 'address.city')
    assertEquals(matchWholePlaceholder('key={{key}}'), null)
    assertEquals(matchWholePlaceholder('plain text'), null)
  },
})

Deno.test('interpolate replaces a whole-string placeholder (string field)', () => {
  assertEquals(interpolate('{{email}}', { email: 'a@b.com' }), 'a@b.com')
})

Deno.test('interpolate replaces a placeholder embedded in surrounding text', () => {
  assertEquals(interpolate('key={{key}}', { key: 'abc' }), 'key=abc')
})

Deno.test('interpolate replaces multiple placeholders in the same string', () => {
  assertEquals(
    interpolate('Hello {{name}}, your id is {{id}}', { name: 'Ann', id: 42 }),
    'Hello Ann, your id is 42',
  )
})

Deno.test('interpolate resolves a nested dot-path', () => {
  assertEquals(
    interpolate('{{address.city}}', { address: { city: 'Bogotá' } }),
    'Bogotá',
  )
})

Deno.test('interpolate replaces a missing field embedded in text with an empty string', () => {
  assertEquals(interpolate('x={{missing}}', {}), 'x=')
})

Deno.test('interpolate replaces null/undefined with an empty string when embedded in text', () => {
  assertEquals(interpolate('{{a}}-{{b}}', { a: null, b: undefined }), '-')
})

Deno.test('interpolate leaves a string with no placeholders untouched', () => {
  assertEquals(interpolate('plain text', { field: 'x' }), 'plain text')
})

Deno.test('interpolate walks plain objects recursively', () => {
  const result = interpolate(
    { to: '{{email}}', nested: { subject: 'Hi {{name}}' } },
    { email: 'a@b.com', name: 'Ann' },
  )
  assertEquals(result, { to: 'a@b.com', nested: { subject: 'Hi Ann' } })
})

Deno.test('interpolate walks arrays recursively', () => {
  assertEquals(
    interpolate(['{{a}}', '{{b}}'], { a: '1', b: '2' }),
    ['1', '2'],
  )
})

Deno.test('interpolate leaves non-string primitives untouched', () => {
  assertEquals(interpolate(42, {}), 42)
  assertEquals(interpolate(true, {}), true)
  assertEquals(interpolate(null, {}), null)
  assertEquals(interpolate(undefined, {}), undefined)
})

Deno.test('interpolate preserves the real type when the whole value is one placeholder', () => {
  assertEquals(interpolate<any>('{{amount}}', { amount: 42 }), 42)
  assertEquals(interpolate<any>('{{active}}', { active: false }), false)
  assertEquals(
    interpolate<any>('{{address}}', { address: { city: 'Bogotá' } }),
    {
      city: 'Bogotá',
    },
  )
  assertEquals(interpolate<any>('{{tags}}', { tags: ['a', 'b'] }), ['a', 'b'])
})

Deno.test('interpolate preserves null/undefined for a whole-value placeholder', () => {
  assertEquals(interpolate<any>('{{missing}}', {}), undefined)
  assertEquals(interpolate<any>('{{value}}', { value: null }), null)
})

Deno.test('interpolate stringifies a non-string field mixed with other text', () => {
  assertEquals(
    interpolate('https://x.com?value={{value}}', { value: 42 }),
    'https://x.com?value=42',
  )
  assertEquals(
    interpolate('https://x.com?active={{active}}', { active: false }),
    'https://x.com?active=false',
  )
})

Deno.test('interpolate leaves a ${{ENV_VAR}} placeholder untouched', () => {
  assertEquals(interpolate('Bearer ${{TOKEN}}', {}), 'Bearer ${{TOKEN}}')
  assertEquals(interpolate('${{TOKEN}}', {}), '${{TOKEN}}')
})

Deno.test('interpolateEnv replaces a whole-string ${{VAR}} placeholder', () => {
  Deno.env.set('TEST_INTERPOLATE_ENV_VAR', 'my-secret-key')
  try {
    assertEquals(
      interpolateEnv('${{TEST_INTERPOLATE_ENV_VAR}}'),
      'my-secret-key',
    )
  } finally {
    Deno.env.delete('TEST_INTERPOLATE_ENV_VAR')
  }
})

Deno.test('interpolateEnv replaces a ${{VAR}} placeholder embedded in surrounding text', () => {
  Deno.env.set('TEST_INTERPOLATE_ENV_VAR', 'abc')
  try {
    assertEquals(
      interpolateEnv('Bearer ${{TEST_INTERPOLATE_ENV_VAR}}'),
      'Bearer abc',
    )
  } finally {
    Deno.env.delete('TEST_INTERPOLATE_ENV_VAR')
  }
})

Deno.test('interpolateEnv replaces multiple ${{VAR}} placeholders in the same string', () => {
  Deno.env.set('TEST_ENV_HOST', 'example.com')
  Deno.env.set('TEST_ENV_PATH', 'api')
  Deno.env.set('TEST_ENV_TOKEN', 'xyz')
  try {
    assertEquals(
      interpolateEnv(
        '${{TEST_ENV_HOST}}/${{TEST_ENV_PATH}}/${{TEST_ENV_TOKEN}}',
      ),
      'example.com/api/xyz',
    )
  } finally {
    Deno.env.delete('TEST_ENV_HOST')
    Deno.env.delete('TEST_ENV_PATH')
    Deno.env.delete('TEST_ENV_TOKEN')
  }
})

Deno.test('interpolateEnv substitutes the literal text "undefined" for an unset variable', () => {
  Deno.env.delete('TEST_INTERPOLATE_ENV_MISSING')
  assertEquals(
    interpolateEnv('${{TEST_INTERPOLATE_ENV_MISSING}}'),
    'undefined',
  )
  assertEquals(
    interpolateEnv('Bearer ${{TEST_INTERPOLATE_ENV_MISSING}}'),
    'Bearer undefined',
  )
})

Deno.test('interpolateEnv walks plain objects and arrays recursively', () => {
  Deno.env.set('TEST_ENV_TOKEN', 'abc')
  try {
    const result = interpolateEnv({
      headers: { authorization: 'Bearer ${{TEST_ENV_TOKEN}}' },
      body: { apiUrl: '${{TEST_ENV_TOKEN}}' },
      list: ['${{TEST_ENV_TOKEN}}'],
    })
    assertEquals(result, {
      headers: { authorization: 'Bearer abc' },
      body: { apiUrl: 'abc' },
      list: ['abc'],
    })
  } finally {
    Deno.env.delete('TEST_ENV_TOKEN')
  }
})

Deno.test('interpolateEnv leaves non-string primitives untouched', () => {
  assertEquals(interpolateEnv(42), 42)
  assertEquals(interpolateEnv(true), true)
  assertEquals(interpolateEnv(null), null)
  assertEquals(interpolateEnv(undefined), undefined)
})

Deno.test('interpolateEnv leaves a {{field}} model placeholder untouched', () => {
  assertEquals(interpolateEnv('{{email}}'), '{{email}}')
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
  const result = interpolateUrl('https://x.com?tags={{tags}}', {
    tags: ['a', 'b', 'c'],
  })
  assertEquals(result, 'https://x.com?tags=a&tags=b&tags=c')
})

Deno.test('interpolateUrl expands a nested-object placeholder using bracket notation', () => {
  const result = interpolateUrl('https://x.com?address={{address}}', {
    address: { city: 'Bogotá', zip: '110111' },
  })
  assertEquals(
    result,
    'https://x.com?address%5Bcity%5D=Bogot%C3%A1&address%5Bzip%5D=110111',
  )
})

Deno.test('interpolateUrl keeps a simple whole-value string placeholder as a plain param', () => {
  assertEquals(
    interpolateUrl('https://x.com?email={{email}}', { email: 'a@b.com' }),
    'https://x.com?email=a%40b.com',
  )
})

Deno.test('interpolateUrl preserves multiple query params, mixing plain and array values', () => {
  const result = interpolateUrl('https://x.com?page=1&tags={{tags}}', {
    tags: ['a', 'b'],
  })
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
