import { assertEquals, assertMatch, assertNotMatch } from '@std/assert'
import * as regex from 'utils/regex.ts'

const {
  commentRegex,
  enclosedStringRegex,
  isoDatetimeRegex,
  keyValueRegex,
  singleQuoteRegex,
  uuidRegex,
  emailRegex,
  phoneRegex,
  urlRegex,
  securePasswordRegex,
  usernameRegex,
  default: {
    zanixScopeLib,
    leftWhiteSpacesRegex,
    baseLineCommentRegex,
    keyPartsRegex,
    keyPartsTestRegex,
  },
} = regex

Deno.test('Validates general regex', () => {
  /** Enclosed string regex should match strings enclosed by any type of quote*/

  assertMatch('"This is a test"', enclosedStringRegex) // Double quotes
  assertMatch("'This is another test'", enclosedStringRegex) // Single quotes
  assertMatch('`This is a backtick string`', enclosedStringRegex) // Backticks
  // This will not match as the string is not enclosed in any quotes
  assertNotMatch('This is a test', enclosedStringRegex) // Should not match without quotes
  // Test for escaped quotes inside the string
  assertMatch('"Escaped quote: \\"inside\\""', enclosedStringRegex) // String with escaped quotes
  assertMatch("'Escaped single quote: \\'inside\\'", enclosedStringRegex)

  /** Single quote regex should match strings wrapped in double quotes and not containing single quotes */
  assertMatch('"This is a valid string"', singleQuoteRegex) // Valid case
  assertNotMatch('"This is an invalid string with a \' single quote"', singleQuoteRegex) // Invalid case with single quote inside
  assertNotMatch("'This is a string with single quotes'", singleQuoteRegex) // Should not match strings with single quotes

  /** Comment regex should match both single-line and multi-line comments */
  assertMatch('// This is a single-line comment', commentRegex) // Single-line comment
  assertMatch('/* This is a multi-line comment */', commentRegex) // Multi-line comment
  assertNotMatch('This is not a comment', commentRegex) // Should not match normal text
  assertNotMatch('var x = "/* not a comment */";', commentRegex) // Should not match inside strings
  assertNotMatch('var x = "`\'/* not a comment */\'`";', commentRegex) // Should not match inside strings

  /** Key value regex should match valid key-value pairs */
  assertMatch('key: "value"', keyValueRegex) // Valid key-value pair with double quotes
  assertMatch("key: 'value'", keyValueRegex) // Valid key-value pair with single quotes
  assertMatch('key: `value`', keyValueRegex) // Valid key-value pair with backticks
  assertNotMatch('key: value', keyValueRegex) // Invalid key-value pair without quotes around value
  assertNotMatch('invalid key: "value"', keyValueRegex) // Invalid key with spaces or special characters

  /** UUID Regex */
  assertMatch('550e8400-e29b-41d4-a716-446655440000', uuidRegex)
  assertNotMatch('50e400-e29b-41d4-a716-446655440000', uuidRegex)

  /** Dates regex */
  assertMatch('2025-03-09T21:40:18.443Z', isoDatetimeRegex)
  assertNotMatch('2025-03-09T21:40:18.443', isoDatetimeRegex)

  /** Email regex */
  assertMatch('usuario@example.com', emailRegex)
  assertMatch('test.email+alias@gmail.com', emailRegex)
  assertNotMatch('usuario@com', emailRegex)
  assertNotMatch('usuario@@example.com', emailRegex)

  /** Phone regex */
  assertMatch('+1234567890', phoneRegex)
  assertMatch('1234567890', phoneRegex)
  assertNotMatch('+1 234 567 890', phoneRegex)
  assertNotMatch('abc123', phoneRegex)

  /** url regex */
  assertMatch('https://example.com', urlRegex)
  assertMatch('http://www.google.com', urlRegex)
  assertMatch('www.github.com', urlRegex)
  assertNotMatch('notaurl', urlRegex)
  assertNotMatch('http:/invalid.com"', urlRegex)

  /** Password regex */
  assertMatch('StrongPass1', securePasswordRegex)
  assertMatch('Secure123!', securePasswordRegex)
  assertNotMatch('weakpass', securePasswordRegex)
  assertNotMatch('12345678', securePasswordRegex)

  /** Username regex */
  assertMatch('usuario_123', usernameRegex)
  assertMatch('NombreDeUsuario', usernameRegex)
  assertNotMatch('us', usernameRegex)
  assertNotMatch('usuario!', usernameRegex)
})

Deno.test('Validates internal regex', () => {
  assertMatch(
    'https://jsr.io/@zanix/utils/1.0.0/src/modules/helpers/zanix/folders/mod.ts',
    zanixScopeLib,
  )
  assertMatch('@zanix/utils/1.0.0/src/modules/helpers/zanix/folders/mod.ts', zanixScopeLib)

  assertNotMatch('utils/1.0.0/src/modules/helpers/zanix/folders/mod.ts', zanixScopeLib)
  assertNotMatch(
    'https://jsr.io/utils/1.0.0/src/modules/helpers/zanix/folders/mod.ts',
    zanixScopeLib,
  )

  /** Left white spaces regex should match leading whitespaces */
  assertMatch('   Some text', leftWhiteSpacesRegex) // Matches leading spaces
  assertMatch('\tSome text', leftWhiteSpacesRegex) // Matches leading tabs
  assertNotMatch('No leading spaces', leftWhiteSpacesRegex) // Should not match if no leading spaces

  /** Base line comment regex should match incomplete comment beginnings */
  assertMatch('/', baseLineCommentRegex) // Single-line comment beginning
  assertMatch('*', baseLineCommentRegex) // Multi-line comment beginning
  assertNotMatch('This is not a comment start', baseLineCommentRegex) // Should not match normal text

  /** Nested regex validations */
  assertEquals('key[subkey]'.match(keyPartsRegex), ['key', 'subkey'])
  assertEquals('key[subkey][subsubkey]'.match(keyPartsRegex), ['key', 'subkey', 'subsubkey'])
  assertEquals('nosubKeys[]'.match(keyPartsRegex), ['nosubKeys'])
  assertMatch('key[subkey]', keyPartsTestRegex) // Must match
  assertMatch('key[subkey][subsubkey]', keyPartsTestRegex) // Must match
  assertMatch('key[subkey][subsubkey][subsub]', keyPartsTestRegex) // Must match
  assertNotMatch('key', keyPartsTestRegex) // Should not match
  assertNotMatch('key[]', keyPartsTestRegex) // Should not match
})
