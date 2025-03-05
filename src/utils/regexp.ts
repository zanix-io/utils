/**
 * Matches any type of quote (single, double, or backtick) and its contents.
 * It captures strings that are enclosed by any type of quote and handles escaped characters
 */
export const quotedStringRegex = /('|"|`)(?:\\.|[^\\])*?\1/g

/**
 * Matches a string that is wrapped in double quotes and does not contain single quotes
 * It matches a string like: "some text here" (but not "some ' text" here")
 */
export const singleQuoteRegex = /^"[^']*"$/

/**
 * Matches the leading whitespace (spaces, tabs, etc.) at the beginning of a string
 * It captures all the spaces or tabs at the start of a string (if any)
 */
export const whiteSpacesRegex = /^(\s*)/

/**
 * Matches both single-line (`// ...`) and multi-line (`/* ... *\/`) comments
 * in a string. Ensures that comments are only captured when they are not
 * part of another structure (e.g., inside a string).
 */
export const commentRegex = /(?<!\S)\/\/.*|\/\*[\s\S]*?\*\//g

/**
 * Matches incomplete comment beginnings (`/` or `*` at the start of a line),
 * typically used to detect unfinished comment syntax.
 */
export const incompleteCommentRegex = /^(\/|\*)/g

/**
 * Matches a key-value pair where the key follows standard identifier rules
 * (letters, numbers, `_`, `$`), and the value is enclosed in single (`'`),
 * double (`"`), or backtick (`` ` ``) quotes.
 * Ensures proper spacing around `:` and captures the entire declaration.
 */
export const keyValueRegex = /^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*['"`].*['"`]\s*$/
