// deno-lint-ignore-file ban-types
import type { Logger } from 'modules/logger/main.ts'

type DefaultLogger = typeof Logger['prototype']

type ZanixTemplates = 'base'
type ZanixBaseFolder<
  S extends Record<string, Partial<ZanixBaseFolder>> | undefined = undefined,
  O extends 'noTemplates' | undefined = undefined,
> = Omit<
  {
    readonly FOLDER: string
    get NAME(): string
    templates: Record<ZanixTemplates, {
      PATH: string
      content(local: ZanixLocalContentProps): Promise<string>
    }[]>
    subfolders: S
  },
  O extends 'noTemplates' ? (S extends undefined ? 'subfolders' | 'templates' : 'templates')
    : (S extends undefined ? 'subfolders' : never)
>

export type ZanixLocalContentProps = { metaUrl: string; relativePath: string }

export type ZanixProjectsFull = ZanixProjects | 'all' | undefined

type ZanixSrcTree<T extends ZanixProjectsFull> = T extends 'server' ? { server: ZanixServerSrcTree }
  : T extends 'app' ? { app: ZanixAppSrcTree }
  : T extends 'library' ? { library: ZanixLibrarySrcTree }
  : T extends 'app-server' ? {
      app: ZanixAppSrcTree
      server: ZanixServerSrcTree
    }
  : T extends 'all' ? {
      library: ZanixLibrarySrcTree
      app: ZanixAppSrcTree
      server: ZanixServerSrcTree
    }
  : {}

type ZanixProjectSrc<T extends ZanixProjectsFull> = T extends 'library' ? {}
  : T extends undefined ? {}
  : {
    zanix: ZanixBaseFolder
  }

/**
 * Defines the 'ZanixProjects' type, which is a reference to ZnxProjects
 * This type represents the available projects in Zanix.
 */
export type ZanixProjects = 'library' | 'server' | 'app' | 'app-server'

/**
 * Represents a generic folder structure used to model a file system where each folder
 * can contain other subfolders (recursively) and files
 */
export type ZanixFolderGenericTree = Partial<
  ZanixBaseFolder<
    Record<string, ZanixBaseFolder>
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
export type ZanixLibrarySrcTree = ZanixBaseFolder<
  { templates: ZanixBaseFolder<undefined, 'noTemplates'> }
>

/**
 * Zanix App Folder structure
 * @experimental
 */
export type ZanixAppSrcTree = ZanixBaseFolder<{
  components: ZanixBaseFolder
  layout: ZanixBaseFolder
  pages: ZanixBaseFolder
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
    dist: ZanixBaseFolder
    docs: ZanixBaseFolder
    src: ZanixBaseFolder<
      ZanixSrcTree<T> & {
        tests: ZanixBaseFolder<{
          functional: ZanixBaseFolder
          integration: ZanixBaseFolder
          unit: ZanixBaseFolder
        }, 'noTemplates'>
        shared: ZanixBaseFolder<
          T extends 'library' ? never : T extends undefined ? {} : {
            middlewares: ZanixBaseFolder
          },
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
 * Global library type modules definition
 */
// TODO: Add a global declaration once JSR supports global namespaces.
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

type ZanixBaseLibraryInfo = { version: string }

/** Zanix library types. Shows library name and version */
export type ZanixLibraries = {
  '@zanix/app': ZanixBaseLibraryInfo
  '@zanix/auth': ZanixBaseLibraryInfo
  '@zanix/asyncmq': ZanixBaseLibraryInfo
  '@zanix/core': ZanixBaseLibraryInfo
  '@zanix/datamaster': ZanixBaseLibraryInfo
  '@zanix/server': ZanixBaseLibraryInfo
  '@zanix/tasker': ZanixBaseLibraryInfo
  '@zanix/utils': ZanixBaseLibraryInfo
}
