const enclosedStringRegex = /(['"`])(?:\\\1|.)*?\1/
const singleQuoteRegex = /^"[^']*"$/
const leftWhiteSpacesRegex = /^\s+/
const commentRegex = /(?<!['"`])\/\/.*|(?<!['"`])\/\*[\s\S]*?\*\/(?!['"`])/
const baseLineCommentRegex = /^(\/|\*).*/
const keyValueRegex = /^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*['"`].*['"`]\s*$/
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isoDatetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
const utcTimeRegex = /^\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const localTimeRegex = /^\d{1,2}:\d{2}:\d{2} ?(AM|PM)?$/
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

/** Available regular expressions */
export default {
  /**
   * Matches the beginning of a line comment (`//`) or the start of a multi-line comment (`/*`),
   * commonly used to detect whether a line is part of a comment or contains unfinished comment syntax.
   */
  baseLineCommentRegex,
  /**
   * Matches both single-line (`// ...`) and multi-line (`/* ... *\/`) comments
   * in a string. Ensures that comments are only captured when they are not
   * part of another structure (e.g., inside a string).
   */
  commentRegex,
  /**
   * Matches any type of quote (single, double, or backtick) and its contents.
   * It captures strings that are enclosed by any type of quote and handles escaped characters
   */
  enclosedStringRegex,
  /**
   * Validates if a date string is in the format "YYYY-MM-DD".
   * This regular expression ensures the string has the correct format but does not check if the date is valid.
   */
  isoDateRegex,
  /**
   * Validates a date-time string in the format "YYYY-MM-DDTHH:MM:SS.MMMZ" (ISO 8601).
   * This regular expression ensures the date is in the correct format, optionally including milliseconds.
   */
  isoDatetimeRegex,
  /**
   * Matches a key-value pair where the key follows standard identifier rules
   * (letters, numbers, `_`, `$`), and the value is enclosed in single (`'`),
   * double (`"`), or backtick (`` ` ``) quotes.
   * Ensures proper spacing around `:` and captures the entire declaration.
   */
  keyValueRegex,
  /**
   * Matches the leading whitespace (spaces, tabs, etc.) at the beginning of a string
   * It captures all the spaces or tabs at the start of a string (if any)
   */
  leftWhiteSpacesRegex,
  /**
   * Validates a time string in the format "H:MM:SS AM/PM" or "H:MM:SS", representing a 12-hour time format.
   * The time may optionally include "AM" or "PM", but it is not required.
   */
  localTimeRegex,
  /**
   * Matches a string that is wrapped in double quotes and does not contain single quotes
   * It matches a string like: "some text here" (but not "some ' text" here")
   */
  singleQuoteRegex,
  /**
   * Validates a time string in the format "HH:MM:SS.MMMZ", which represents a time in UTC with milliseconds.
   * This regular expression ensures the time is in the correct format, including milliseconds and the `Z` for UTC.
   */
  utcTimeRegex,
  /**
   * This regular expression is used to validate UUID v4 format.
   * UUID (Universally Unique Identifier) is a 128-bit identifier commonly used in databases, distributed systems, and cryptography.
   */
  uuidRegex,
}
