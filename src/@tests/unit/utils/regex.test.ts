import { assertEquals, assertMatch, assertNotMatch } from '@std/assert'
import * as regex from 'utils/regex.ts'

const {
  COMMENT_REGEX,
  ENCLOSED_STRING_REGEX,
  ISO_DATETIME_REGEX,
  KEY_VALUE_REGEX,
  SINGLE_QUOTE_REGEX,
  UUID_REGEX,
  EMAIL_REGEX,
  PHONE_REGEX,
  URL_REGEX,
  SECURE_PASSWORD_REGEX,
  USERNAME_REGEX,
  default: {
    ZANIX_SCOPE_LIB_REGEX,
    LEFT_WHITE_SPACES_REGEX,
    BASE_LINE_COMMENT_REGEX,
    KEY_PARTS_REGEX,
    KEY_PARTS_TEST_REGEX,
  },
} = regex

Deno.test('Validates general regex', () => {
  /** Enclosed string regex should match strings enclosed by any type of quote*/

  assertMatch('"This is a test"', ENCLOSED_STRING_REGEX) // Double quotes
  assertMatch("'This is another test'", ENCLOSED_STRING_REGEX) // Single quotes
  assertMatch('`This is a backtick string`', ENCLOSED_STRING_REGEX) // Backticks
  // This will not match as the string is not enclosed in any quotes
  assertNotMatch('This is a test', ENCLOSED_STRING_REGEX) // Should not match without quotes
  // Test for escaped quotes inside the string
  assertMatch('"Escaped quote: \\"inside\\""', ENCLOSED_STRING_REGEX) // String with escaped quotes
  assertMatch("'Escaped single quote: \\'inside\\'", ENCLOSED_STRING_REGEX)

  /** Single quote regex should match strings wrapped in double quotes and not containing single quotes */
  assertMatch('"This is a valid string"', SINGLE_QUOTE_REGEX) // Valid case
  assertNotMatch(
    '"This is an invalid string with a \' single quote"',
    SINGLE_QUOTE_REGEX,
  ) // Invalid case with single quote inside
  assertNotMatch("'This is a string with single quotes'", SINGLE_QUOTE_REGEX) // Should not match strings with single quotes

  /** Comment regex should match both single-line and multi-line comments */
  assertMatch('// This is a single-line comment', COMMENT_REGEX) // Single-line comment
  assertMatch('/* This is a multi-line comment */', COMMENT_REGEX) // Multi-line comment
  assertNotMatch('This is not a comment', COMMENT_REGEX) // Should not match normal text
  assertNotMatch('var x = "/* not a comment */";', COMMENT_REGEX) // Should not match inside strings
  assertNotMatch('var x = "`\'/* not a comment */\'`";', COMMENT_REGEX) // Should not match inside strings

  /** Key value regex should match valid key-value pairs */
  assertMatch('key: "value"', KEY_VALUE_REGEX) // Valid key-value pair with double quotes
  assertMatch("key: 'value'", KEY_VALUE_REGEX) // Valid key-value pair with single quotes
  assertMatch('key: `value`', KEY_VALUE_REGEX) // Valid key-value pair with backticks
  assertNotMatch('key: value', KEY_VALUE_REGEX) // Invalid key-value pair without quotes around value
  assertNotMatch('invalid key: "value"', KEY_VALUE_REGEX) // Invalid key with spaces or special characters

  /** UUID Regex */
  assertMatch('550e8400-e29b-41d4-a716-446655440000', UUID_REGEX)
  assertNotMatch('50e400-e29b-41d4-a716-446655440000', UUID_REGEX)

  /** Dates regex */
  assertMatch('2025-03-09T21:40:18.443Z', ISO_DATETIME_REGEX)
  assertNotMatch('2025-03-09T21:40:18.443', ISO_DATETIME_REGEX)

  /** Email regex */
  assertMatch('usuario@example.com', EMAIL_REGEX)
  assertMatch('test.email+alias@gmail.com', EMAIL_REGEX)
  assertNotMatch('usuario@com', EMAIL_REGEX)
  assertNotMatch('usuario@@example.com', EMAIL_REGEX)

  /** Phone regex */
  assertMatch('+1234567890', PHONE_REGEX)
  assertMatch('1234567890', PHONE_REGEX)
  assertNotMatch('+1 234 567 890', PHONE_REGEX)
  assertNotMatch('abc123', PHONE_REGEX)

  /** url regex */
  assertMatch('https://example.com', URL_REGEX)
  assertMatch('http://www.google.com', URL_REGEX)
  assertMatch('www.github.com', URL_REGEX)
  assertNotMatch('notaurl', URL_REGEX)
  assertNotMatch('http:/invalid.com"', URL_REGEX)

  /** Password regex */
  assertMatch('StrongPass1', SECURE_PASSWORD_REGEX)
  assertMatch('Secure123!', SECURE_PASSWORD_REGEX)
  assertNotMatch('weakpass', SECURE_PASSWORD_REGEX)
  assertNotMatch('12345678', SECURE_PASSWORD_REGEX)

  /** Username regex */
  assertMatch('usuario_123', USERNAME_REGEX)
  assertMatch('NombreDeUsuario', USERNAME_REGEX)
  assertNotMatch('us', USERNAME_REGEX)
  assertNotMatch('usuario!', USERNAME_REGEX)
})

Deno.test('Validates internal regex', () => {
  assertMatch(
    'https://jsr.io/@zanix/utils/1.0.0/src/modules/helpers/zanix/folders/mod.ts',
    ZANIX_SCOPE_LIB_REGEX,
  )
  assertMatch(
    '@zanix/utils/1.0.0/src/modules/helpers/zanix/folders/mod.ts',
    ZANIX_SCOPE_LIB_REGEX,
  )

  assertNotMatch(
    'utils/1.0.0/src/modules/helpers/zanix/folders/mod.ts',
    ZANIX_SCOPE_LIB_REGEX,
  )
  assertNotMatch(
    'https://jsr.io/utils/1.0.0/src/modules/helpers/zanix/folders/mod.ts',
    ZANIX_SCOPE_LIB_REGEX,
  )

  /** Left white spaces regex should match leading whitespaces */
  assertMatch('   Some text', LEFT_WHITE_SPACES_REGEX) // Matches leading spaces
  assertMatch('\tSome text', LEFT_WHITE_SPACES_REGEX) // Matches leading tabs
  assertNotMatch('No leading spaces', LEFT_WHITE_SPACES_REGEX) // Should not match if no leading spaces

  /** Base line comment regex should match incomplete comment beginnings */
  assertMatch('/', BASE_LINE_COMMENT_REGEX) // Single-line comment beginning
  assertMatch('*', BASE_LINE_COMMENT_REGEX) // Multi-line comment beginning
  assertNotMatch('This is not a comment start', BASE_LINE_COMMENT_REGEX) // Should not match normal text

  /** Nested regex validations */
  assertEquals('key[subkey]'.match(KEY_PARTS_REGEX), ['key', 'subkey'])
  assertEquals('key[subkey][subsubkey]'.match(KEY_PARTS_REGEX), [
    'key',
    'subkey',
    'subsubkey',
  ])
  assertEquals('nosubKeys[]'.match(KEY_PARTS_REGEX), ['nosubKeys'])
  assertMatch('key[subkey]', KEY_PARTS_TEST_REGEX) // Must match
  assertMatch('key[subkey][subsubkey]', KEY_PARTS_TEST_REGEX) // Must match
  assertMatch('key[subkey][subsubkey][subsub]', KEY_PARTS_TEST_REGEX) // Must match
  assertNotMatch('key', KEY_PARTS_TEST_REGEX) // Should not match
  assertNotMatch('key[]', KEY_PARTS_TEST_REGEX) // Should not match
})
