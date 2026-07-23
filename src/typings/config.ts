import type { ZanixProjects } from './zanix.ts'

/**
 * Deno config file type
 */
export interface ConfigFile {
  /** The package name (e.g. `@zanix/utils`). */
  name?: string
  /** Zanix-specific project metadata. */
  zanix?: {
    hash?: string
    project?: ZanixProjects
  }
  /** The package semantic version. */
  version?: `${number}.${number}.${number}`
  /** The SPDX license identifier (e.g. `MIT`). */
  license?: string
  /** TypeScript compiler options. */
  compilerOptions?: {
    /** The JSX transform mode. */
    jsx?: 'react' | 'react-jsx' | 'react-jsxdev' | 'preserve'
    strict: boolean
    noImplicitAny: boolean
  }
  /** Import map used to resolve bare specifiers. */
  imports?: Record<string, string>
  /** Options applied when publishing the package. */
  publish?: {
    exclude?: string[]
  }
  /** Named `deno task` scripts defined for this project. */
  tasks?: Record<string, string>
  /** Linter configuration. */
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
  /** Formatter configuration. */
  fmt?: {
    exclude?: string[]
    /** Markdown wrap lines. */
    proseWrap?: 'always' | 'never' | 'preserve'
    /** Sets the number of spaces per indentation level. */
    indentWidth?: number
    /** Maximum line length before wrapping. */
    lineWidth?: number
    /** Indent lines with spaces instead of tabs. */
    useTabs?: boolean
    /** Use single quotes for strings instead of double quotes. */
    singleQuote?: boolean
    /** Avoid using semicolons at the end of statements. */
    semiColons?: boolean
  }
  /** Test runner configuration. */
  test?: {
    exclude?: string[]
    include?: string[]
  }
}
