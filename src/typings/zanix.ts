// deno-lint-ignore-file ban-types
import type { Logger } from 'modules/logger/main.ts'

/** The default `Logger` instance shape exposed via `Znx.logger`. */
export type DefaultLogger = typeof Logger['prototype']

/** Maps each Zanix project type to its `src` subfolder shape. */
export type ZanixSrcTreeMap = {
  server: { server: ZanixServerSrcTree }
  app: { app: ZanixAppSrcTree }
  library: { modules: ZanixLibrarySrcTree }
  'app-server': { app: ZanixAppSrcTree; server: ZanixServerSrcTree }
  all: { modules: ZanixLibrarySrcTree; app: ZanixAppSrcTree; server: ZanixServerSrcTree }
}

/** Resolves the `src` subfolder shape for a given Zanix project type. */
export type ZanixSrcTree<T extends ZanixProjectsFull> = T extends keyof ZanixSrcTreeMap
  ? ZanixSrcTreeMap[T]
  : {}

/** Resolves the `zanix` folder addition for non-library Zanix project types. */
export type ZanixProjectSrc<T extends ZanixProjectsFull> = T extends 'library' | undefined ? {}
  : { zanix: ZanixBaseFolder }

type ZanixSubfolderOptions<S> = S extends { subfolders: infer U }
  ? U extends Record<string, unknown>
    ? { subfolders: { [K in keyof U]: ZanixTreeFolderOptions<U[K]> } }
  : object
  : object

type ZanixTemplateOptions<S> = S extends { templates: unknown } ? ZanixFolderOptions : {}

export type ZanixFolderOptions = {
  templates: {
    [name in ZanixTemplates]: {
      files: string[]
      jsr?: keyof ZanixLibraries
    }
  }
}

export type ZanixTreeFolderOptions<S> = ZanixSubfolderOptions<S> & ZanixTemplateOptions<S>
/** A record of generated template files, grouped by template category. */
export type ZanixTemplatesRecord = Record<
  ZanixTemplates,
  { PATH: string; NAME: string; content(local: ZanixLocalContentProps): Promise<string> }[]
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
export type ZanixProjects = 'library' | 'server' | 'app' | 'app-server'

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
 * Zanix App Folder structure
 * @experimental
 */
export type ZanixAppSrcTree = ZanixBaseFolder<{
  Components: ZanixBaseFolder
  Layout: ZanixBaseFolder
  Pages: ZanixBaseFolder
  resources: ZanixBaseFolder<{
    intl: ZanixBaseFolder<{ es: ZanixBaseFolder }, 'noTemplates'>
    public: ZanixBaseFolder<{
      assets: ZanixBaseFolder<{
        docs: ZanixBaseFolder
        fonts: ZanixBaseFolder
        icons: ZanixBaseFolder
        images: ZanixBaseFolder
        videos: ZanixBaseFolder
      }, 'noTemplates'>
      scripts: ZanixBaseFolder
      sitemap: ZanixBaseFolder
      styles: ZanixBaseFolder<{
        apps: ZanixBaseFolder
        global: ZanixBaseFolder
      }>
    }, 'noTemplates'>
  }, 'noTemplates'>
}, 'noTemplates'>

/** Zanix general folders */
export type ZanixFolderTree<T extends ZanixProjectsFull = undefined> = ZanixBaseFolder<
  ZanixProjectSrc<T> & {
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
          T extends 'library' | undefined ? {} : { middlewares: ZanixBaseFolder },
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
      hash?: string
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
