/**
 * Matches both single-line (`// ...`) and multi-line (`/* ... *\/`) comments
 * in a string. Ensures that comments are only captured when they are not
 * part of another structure (e.g., inside a string).
 */
export const COMMENT_REGEX = /(?<!['"`])\/\/.*|(?<!['"`])\/\*[\s\S]*?\*\/(?!['"`])/

/**
 * Matches a valid email. This regular expression ensures the email is in the correct format,
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

/**
 * Matches any type of quote (single, double, or backtick) and its contents.
 * It captures strings that are enclosed by any type of quote and handles escaped characters
 */
export const ENCLOSED_STRING_REGEX = /(['"`])(?:\\\1|.)*?\1/

/**
 * Validates if a date string is in the format "YYYY-MM-DD".
 * This regular expression ensures the string has the correct format but does not check if the date is valid.
 */
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * Validates a date-time string in the format "YYYY-MM-DDTHH:MM:SS.MMMZ" (ISO 8601).
 * This regular expression ensures the date is in the correct format, optionally including milliseconds.
 */
export const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/

/**
 * Matches a key-value pair where the key follows standard identifier rules
 * (letters, numbers, `_`, `$`), and the value is enclosed in single (`'`),
 * double (`"`), or backtick (`` ` ``) quotes.
 * Ensures proper spacing around `:` and captures the entire declaration.
 */
export const KEY_VALUE_REGEX = /^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*['"`].*['"`]\s*$/

/**
 * Validates a time string in the format "H:MM:SS AM/PM" or "H:MM:SS", representing a 12-hour time format.
 * The time may optionally include "AM" or "PM", but it is not required.
 */
export const LOCAL_TIME_REGEX = /^\d{1,2}:\d{2}:\d{2} ?(AM|PM)?$/

/**
 * Regular expression to validate a MongoDB ObjectId string.
 * - Must be exactly 24 hexadecimal characters.
 */
export const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/

/**
 * Regular expression to validate international phone numbers.
 * - Can start with an optional `+` followed by a country code.
 * - Must contain only digits and have a length between 2 and 15.
 */
export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/

/**
 * Regular expression to validate secure passwords.
 * - Must be at least 8 characters long.
 * - Must contain at least one uppercase letter, one lowercase letter, and one number.
 * - Special characters are allowed.
 */
export const SECURE_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/

/**
 * Matches a string that is wrapped in double quotes and does not contain single quotes
 * It matches a string like: "some text here" (but not "some ' text" here")
 */
export const SINGLE_QUOTE_REGEX = /^"[^']*"$/

/**
 * Regular expression to validate URLs.
 * - Supports `http` and `https` protocols.
 * - Allows `www.` subdomain but it's optional.
 * - Ensures a valid domain name followed by a top-level domain (TLD).
 */
export const URL_REGEX = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}([/?].*)?$/

/**
 * Regular expression to validate usernames.
 * - Must be between 3 and 16 characters long.
 * - Can only contain letters, numbers, and underscores (_).
 */
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,16}$/

/**
 * Validates a time string in the format "HH:MM:SS.MMMZ", which represents a time in UTC with milliseconds.
 * This regular expression ensures the time is in the correct format, including milliseconds and the `Z` for UTC.
 */
export const UTC_TIME_REGEX = /^\d{2}:\d{2}:\d{2}\.\d{3}Z$/

/**
 * This regular expression is used to validate UUID v4 format.
 * UUID (Universally Unique Identifier) is a 128-bit identifier commonly used in databases, distributed systems, and cryptography.
 */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Regular expression to validate version strings in the format x.x.x (e.g., 2.0.1).
 */
export const VERSION_REGEX = /^(\d+\.\d+\.\d+(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?|latest)$/

/**
 * Regular expression to validate numeric strings
 */
export const NUMERIC_REGEX = /^\d+(\.\d+)?$/

/**
 * Boolean regex (true/false)
 */
export const BOOLEAN_REGEX = /^(true|false)$/i

/**
 * Available regular expressions for internal use only
 */

const LEFT_WHITE_SPACES_REGEX = /^\s+/
const BASE_LINE_COMMENT_REGEX = /^(\/|\*).*/
const ZANIX_SCOPE_LIB_REGEX = /^(https?:\/\/.*)?@zanix\//
const ANY_EXTENSION_REGEX = /\.[a-z]+$/
const JSR_BASE_URL_REGEX = /^(https:\/\/[^\/]+\/[^\/]+\/[^\/]+\/\d+\.\d+\.\d+)(\/.*)?$/
const KEY_PARTS_REGEX = /([^[\]]+)/g
const KEY_PARTS_TEST_REGEX = /^[a-zA-Z0-9_]+(\[[a-zA-Z0-9_]+\])+$/
// Same prefix `assertZnxCookieName` (`src/utils/cookies.ts`) enforces at runtime — kept as its own
// regex here so `no-invalid-znx-cookie-name` (the lint-time counterpart, for the literal-string
// case) shares the exact same rule instead of drifting from it.
const ZNX_COOKIE_PREFIX_REGEX = /^X-Znx-/

export default {
  ANY_EXTENSION_REGEX,
  BASE_LINE_COMMENT_REGEX,
  LEFT_WHITE_SPACES_REGEX,
  ZANIX_SCOPE_LIB_REGEX,
  JSR_BASE_URL_REGEX,
  KEY_PARTS_REGEX,
  KEY_PARTS_TEST_REGEX,
  ZNX_COOKIE_PREFIX_REGEX,
}
