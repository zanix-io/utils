import { isString, isStringArray } from 'modules/validations/decorators/strings/is-string.ts'
import {
  isNumberString,
  isNumberStringArray,
} from 'modules/validations/decorators/strings/is-number-string.ts'
import { isUUID, isUUIDArray } from 'modules/validations/decorators/strings/is-uuid.ts'
import { stringLength, stringLengthArray } from 'modules/validations/decorators/strings/length.ts'
import { match, matchArray } from 'modules/validations/decorators/strings/match.ts'
import { emailRegex } from 'utils/regex.ts'
import { isPhone, isPhoneArray } from 'modules/validations/decorators/strings/is-phone.ts'
import { isUrl, isUrlArray } from 'modules/validations/decorators/strings/is-url.ts'
import { assertEquals } from '@std/assert'

Deno.test('Validates isString and isStringArray functions', () => {
  assertEquals(isString('This is a string'), true)
  assertEquals(isString(new Date() as never), false)
  assertEquals(isString(4 as never), false)

  assertEquals(isStringArray(['This is a string array']), true)
  assertEquals(isStringArray('This is a string' as never), false)
  assertEquals(isString(['This is a string', 4] as never), false)
})

Deno.test('Validates isNumberString and isNumberStringArray functions', () => {
  assertEquals(isNumberString('4'), true)
  assertEquals(isNumberString('e'), false)
  assertEquals(isNumberString('4d'), false)

  assertEquals(isNumberStringArray(['4', '5']), true)
  assertEquals(isNumberStringArray('10' as never), false)
  assertEquals(isNumberStringArray(['3', 4] as never), false)
  assertEquals(isNumberStringArray(['3', 'd']), false)
})

Deno.test('Validates isUUID and isUUIDArray functions', () => {
  assertEquals(isUUID('9b2f0d5b-3a3e-4c2d-b4d6-8e6f5a1c2e79'), true)
  assertEquals(isUUID('9b2f0d5b-3a3e-4c2d-b4d6-8e6f5a1c2e7'), false)

  assertEquals(
    isUUIDArray(['9b2f0d5b-3a3e-4c2d-b4d6-8e6f5a1c2e79', '9b2f0d5b-3a3e-4c2d-b4d6-8e6f5a1c2379']),
    true,
  )
  assertEquals(isUUIDArray('9b2f0d5b-3a3e-4c2d-b4d6-8e6f5a1c2e79' as never), false)
  assertEquals(isUUIDArray('9b2f0d5b-3a3e-4c2d-b4d6-8e6f5a1c2e' as never), false)
  assertEquals(isUUIDArray(['9b2f0d5b-3a3e-4c2d-b4d6-8e6f5a1c2e79', '']), false)
})

Deno.test('Validates string length and length string array', () => {
  assertEquals(stringLength('qwer', 1, 5), true)
  assertEquals(stringLength('qwerdssf', 4, 10), true)
  assertEquals(stringLength('qwer45', 1, 3), false)
  assertEquals(stringLength('qwer45', 7, 8), false)

  assertEquals(stringLengthArray('1234' as never, 4, 4), false)
  assertEquals(stringLengthArray(['123', '456', '4567'], 3, 5), true)
  assertEquals(stringLengthArray(['123456', '456', '4567'], 3, 5), false)
})

Deno.test('Validates regular expression match ', () => {
  assertEquals(match(emailRegex, 'juan@pablo.com'), true)
  assertEquals(match(emailRegex, 'pepito@gmail.'), false)

  assertEquals(matchArray(emailRegex, 'pepito@gmail.com' as never), false)
  assertEquals(matchArray(emailRegex, ['pepito@gmail.com', 'juan@pablo.com']), true)
  assertEquals(matchArray(emailRegex, ['pepito@gmail.com', 'juan@pablo']), false)
})

Deno.test('Validates phone match ', () => {
  assertEquals(isPhone('3333333333'), true)
  assertEquals(isPhone('+334234'), true)
  assertEquals(isPhone('+334ds234'), false)

  assertEquals(isPhoneArray('3333333333' as never), false)
  assertEquals(isPhoneArray(['3333333333', '4444444444444']), true)
  assertEquals(isPhoneArray(['XXXX', 'CSXS']), false)
})

Deno.test('Validates url match ', () => {
  assertEquals(isUrl('http://www.zanix.co'), true)
  assertEquals(isUrl('http:/www'), false)

  assertEquals(isUrlArray('http://www.zanix.co' as never), false)
  assertEquals(isUrlArray(['http://www.zanix.co', 'http://www.zanix.mx']), true)
  assertEquals(isUrlArray(['http://www.zanix.co', 'CSXS']), false)
})
