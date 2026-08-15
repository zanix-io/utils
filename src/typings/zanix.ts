// deno-lint-ignore-file ban-types
import type { Logger } from 'modules/logger/main.ts'

/** The default `Logger` instance shape exposed via `Znx.logger`. */
export type DefaultLogger = typeof Logger['prototype']

/** Maps each Zanix project type to its `src` subfolder shape. */
export type ZanixSrcTreeMap = {
  server: { server: ZanixServerSrcTree }
  space: { space: ZanixSpaceSrcTree }
  library: { modules: ZanixLibrarySrcTree }
  'space-server': { space: ZanixSpaceSrcTree; server: ZanixServerSrcTree }
  all: {
    modules: ZanixLibrarySrcTree
    space: ZanixSpaceSrcTree
    server: ZanixServerSrcTree
  }
}

/** Resolves the `src` subfolder shape for a given Zanix project type. */
export type ZanixSrcTree<T extends ZanixProjectsFull> = T extends keyof ZanixSrcTreeMap
  ? ZanixSrcTreeMap[T]
  : {}

/** A record of generated template files, grouped by template category. */
export type ZanixTemplatesRecord = Record<
  ZanixTemplates,
  {
    PATH: string
    NAME: string
    content(local: ZanixLocalContentProps): Promise<string>
  }[]
>

/** The base fields present on every Zanix folder-tree node. */
export type ZanixBaseFolderProps<S> = {
  readonly FOLDER: string
  readonly NAME: string
  templates: ZanixTemplatesRecord
  subfolders: S
}

/** The recursive folder-tree shape shared by all Zanix folder structures. */
export type ZanixBaseFolder<
  S extends Record<string, Partial<ZanixBaseFolder>> | undefined = undefined,
  O extends 'noTemplates' | undefined = undefined,
> = Omit<
  ZanixBaseFolderProps<S>,
  O extends 'noTemplates' ? S extends undefined ? 'subfolders' | 'templates'
    : 'templates'
    : S extends undefined ? 'subfolders'
    : never
>

/** Context passed to a template's `content` resolver function. */
export type ZanixLocalContentProps = { metaUrl: string; relativePath?: string }

/** `ZanixProjects` plus the `'all'` and `undefined` (common structure) cases. */
export type ZanixProjectsFull = ZanixProjects | 'all' | undefined

/** Zanix Templates for Automated File Generation */
export type ZanixTemplates = 'base'

/**
 * The Zanix project types supported by the framework.
 */
export type ZanixProjects =
  | 'library'
  | 'server'
  | 'space'
  | 'space-server'
  | 'app'

/**
 * Represents a generic folder structure used to model a file system where each folder
 * can contain other subfolders (recursively) and files
 */
export type ZanixFolderGenericTree = Partial<
  ZanixBaseFolder<
    Record<string, Partial<ZanixBaseFolder>>
  >
>

/** Zanix Server Folder structure */
export type ZanixServerSrcTree = ZanixBaseFolder<{
  connectors: ZanixBaseFolder
  handlers: ZanixBaseFolder<{ rtos: ZanixBaseFolder }>
  interactors: ZanixBaseFolder
  jobs: ZanixBaseFolder
  repositories: ZanixBaseFolder<{ seeders: ZanixBaseFolder }>
}, 'noTemplates'>

/** Zanix Library Folder structure */
export type ZanixLibrarySrcTree = ZanixBaseFolder<undefined>

/**
 * Zanix Space Folder structure — a `@zanix/space` frontend app's real, implemented conventions:
 * file-based page routing rooted at `routes/` (`page.tsx`/`layout.tsx`/`loading.tsx`/`error.tsx`,
 * nested per segment) and `comets/` for selective-hydration client components. Not the
 * `Components/Layout/Pages/resources` shape this type previously had under the name
 * `ZanixAppSrcTree` — that shape was never reconciled against `@zanix/space`'s actual
 * implementation and didn't match it; this replaces it rather than aliasing it.
 * @experimental
 */
export type ZanixSpaceSrcTree = ZanixBaseFolder<{
  routes: ZanixBaseFolder
  comets: ZanixBaseFolder
}, 'noTemplates'>

/** Zanix general folders */
export type ZanixFolderTree<T extends ZanixProjectsFull = undefined> = ZanixBaseFolder<
  {
    '.dist': ZanixBaseFolder<undefined, 'noTemplates'>
    docs: ZanixBaseFolder
    src: ZanixBaseFolder<
      ZanixSrcTree<T> & {
        '@tests': ZanixBaseFolder<{
          functional: ZanixBaseFolder
          integration: ZanixBaseFolder
          unit: ZanixBaseFolder
        }, 'noTemplates'>
        shared: ZanixBaseFolder<
          T extends 'library' | undefined ? {}
            : { middlewares: ZanixBaseFolder },
          'noTemplates'
        >
        typings: ZanixBaseFolder
        utils: ZanixBaseFolder
      },
      'noTemplates'
    >
  }
>

/**
 * Global library type modules definition.
 *
 * JSR does not support a package injecting global namespace declarations into
 * consumers automatically, so this stays as a plain exported interface.
 * Consumers who need typed access to the runtime globals (`Znx`, `logger`, etc.)
 * should declare their own `declare global` block referencing this type, e.g.:
 *
 * ```ts
 * declare global {
 *   const Znx: ZanixGlobal['Znx']
 *   interface Window extends ZanixGlobal {}
 * }
 * ```
 */
export interface ZanixGlobal {
  /** The global logger default instance */
  logger: DefaultLogger
  /** The global onmessage function for workers */
  onmessage?: Worker['onmessageerror']
  /** The global postMessage function for workers */
  postMessage?: Worker['postMessage']
  /** The global zanix module */
  Znx: {
    /** The logger Ref */
    logger: ZanixGlobal['logger']
    /** The base config data */
    config: {
      project?: ZanixProjects
    }
  }
}

/** Basic identifying info for a Zanix library dependency. */
export type ZanixBaseLibraryInfo = { version: string }

/** Zanix library types. Shows library name and version */
export type ZanixLibraries = {
  '@zanix/app': ZanixBaseLibraryInfo
  '@zanix/auth': ZanixBaseLibraryInfo
  '@zanix/asyncmq': ZanixBaseLibraryInfo
  '@zanix/core': ZanixBaseLibraryInfo
  '@zanix/datamaster': ZanixBaseLibraryInfo
  '@zanix/notifications': ZanixBaseLibraryInfo
  '@zanix/server': ZanixBaseLibraryInfo
  '@zanix/worker': ZanixBaseLibraryInfo
  '@zanix/utils': ZanixBaseLibraryInfo
}
