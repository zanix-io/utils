/**
 * Matches both single-line (`// ...`) and multi-line (`/* ... *\/`) comments
 * in a string. Ensures that comments are only captured when they are not
 * part of another structure (e.g., inside a string).
 */
export const commentRegex = /(?<!['"`])\/\/.*|(?<!['"`])\/\*[\s\S]*?\*\/(?!['"`])/

/**
 * Matches a valid email. This regular expression ensures the email is in the correct format,
 */
export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

/**
 * Matches any type of quote (single, double, or backtick) and its contents.
 * It captures strings that are enclosed by any type of quote and handles escaped characters
 */
export const enclosedStringRegex = /(['"`])(?:\\\1|.)*?\1/

/**
 * Validates if a date string is in the format "YYYY-MM-DD".
 * This regular expression ensures the string has the correct format but does not check if the date is valid.
 */
export const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

/**
 * Validates a date-time string in the format "YYYY-MM-DDTHH:MM:SS.MMMZ" (ISO 8601).
 * This regular expression ensures the date is in the correct format, optionally including milliseconds.
 */
export const isoDatetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/

/**
 * Matches a key-value pair where the key follows standard identifier rules
 * (letters, numbers, `_`, `$`), and the value is enclosed in single (`'`),
 * double (`"`), or backtick (`` ` ``) quotes.
 * Ensures proper spacing around `:` and captures the entire declaration.
 */
export const keyValueRegex = /^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*['"`].*['"`]\s*$/

/**
 * Validates a time string in the format "H:MM:SS AM/PM" or "H:MM:SS", representing a 12-hour time format.
 * The time may optionally include "AM" or "PM", but it is not required.
 */
export const localTimeRegex = /^\d{1,2}:\d{2}:\d{2} ?(AM|PM)?$/

/**
 * Regular expression to validate international phone numbers.
 * - Can start with an optional `+` followed by a country code.
 * - Must contain only digits and have a length between 2 and 15.
 */
export const phoneRegex = /^\+?[1-9]\d{1,14}$/

/**
 * Regular expression to validate secure passwords.
 * - Must be at least 8 characters long.
 * - Must contain at least one uppercase letter, one lowercase letter, and one number.
 * - Special characters are allowed.
 */
export const securePasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/

/**
 * Matches a string that is wrapped in double quotes and does not contain single quotes
 * It matches a string like: "some text here" (but not "some ' text" here")
 */
export const singleQuoteRegex = /^"[^']*"$/

/**
 * Regular expression to validate URLs.
 * - Supports `http` and `https` protocols.
 * - Allows `www.` subdomain but it's optional.
 * - Ensures a valid domain name followed by a top-level domain (TLD).
 */
export const urlRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}([/?].*)?$/

/**
 * Regular expression to validate usernames.
 * - Must be between 3 and 16 characters long.
 * - Can only contain letters, numbers, and underscores (_).
 */
export const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/

/**
 * Validates a time string in the format "HH:MM:SS.MMMZ", which represents a time in UTC with milliseconds.
 * This regular expression ensures the time is in the correct format, including milliseconds and the `Z` for UTC.
 */
export const utcTimeRegex = /^\d{2}:\d{2}:\d{2}\.\d{3}Z$/

/**
 * This regular expression is used to validate UUID v4 format.
 * UUID (Universally Unique Identifier) is a 128-bit identifier commonly used in databases, distributed systems, and cryptography.
 */
export const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Regular expression to validate version strings in the format x.x.x (e.g., 2.0.1).
 */
export const versionRegex = /^(\d+\.\d+\.\d+(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?|latest)$/

/**
 * Available regular expressions for internal use only
 */

const leftWhiteSpacesRegex = /^\s+/
const baseLineCommentRegex = /^(\/|\*).*/
const zanixScopeLib = /^(https?:\/\/.*)?@zanix\//
const anyExtensionRegex = /\.[a-z]+$/
const jsrBaseUrlRegex = /^(https:\/\/[^\/]+\/[^\/]+\/[^\/]+\/\d+\.\d+\.\d+)(\/.*)?$/

export default {
  anyExtensionRegex,
  baseLineCommentRegex,
  leftWhiteSpacesRegex,
  zanixScopeLib,
  jsrBaseUrlRegex,
}
