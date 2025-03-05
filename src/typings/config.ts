export interface Config {
  compilerOptions?: {
    jsx?: 'react' | 'react-jsx' | 'react-jsxdev' | 'preserve'
    strict: boolean
    noImplicitAny: boolean
  }
  imports?: Record<string, string>
  tasks?: Record<string, string>
  lint?: {
    rules?: {
      tags?: string[]
      include?: string[]
    }
    exclude?: string[]
    plugins?: string[]
    /**  Linter message format */
    report?: 'compact' | 'json' | 'pretty'
  }
  fmt?: {
    exclude?: string[]
    /** Markdown wrap lines. */
    proseWrap?: 'always' | 'never' | 'preserve'
    /** Maximum line length before wrapping. */
    indentWidth?: number
    /** Sets the number of spaces per indentation level. */
    lineWidth?: number
    /** Indent lines with spaces instead of tabs. */
    useTabs?: boolean
    /** Use single quotes for strings instead of double quotes. */
    singleQuote?: boolean
    /** Avoid using semicolons at the end of statements. */
    semiColons?: boolean
  }
  test?: {
    allowAll?: boolean
    filter?: string
  }
}
