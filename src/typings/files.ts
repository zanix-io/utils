/** File extensions the linter can be configured to check. */
export type LinterAvailableFiles = 'ts' | 'tsx' | 'js' | 'jsx'
/** File extensions the formatter can be configured to check. */
export type FormatAvailableFiles = 'md' | 'json' | LinterAvailableFiles
