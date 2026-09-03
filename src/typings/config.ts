import type { ZanixProjects } from './zanix.ts'

/**
 * Deno config file type
 */
export interface ConfigFile {
  /** The package name (e.g. `@zanix/utils`). */
  name?: string
  /** Zanix-specific project metadata. */
  zanix?: {
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
    /** The module specifier `jsx: 'react-jsx'`/`'react-jsxdev'` imports its runtime helpers from
     * (e.g. `'react'`) — required alongside those two modes, meaningless with `'react'`/`'preserve'`. */
    jsxImportSource?: string
    strict: boolean
    noImplicitAny: boolean
    /** Ambient `.d.ts` files to load globally, regardless of whether anything in the project's
     * own module graph imports them — e.g. `["./src/typings/index.d.ts"]` for a scaffolded
     * `declare global { ... }` file. Without this, `deno check`/`deno test` only pick up a global
     * type when some statically-reachable file happens to import the module that declares it. */
    types?: string[]
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
