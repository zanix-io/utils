// deno-lint-ignore-file ban-types
import type { Logger } from 'modules/logger/main.ts'

type DefaultLogger = typeof Logger['prototype']

type ZanixBaseFolder<
  F extends Record<string, string | null> | undefined = undefined,
  S extends Record<string, Partial<ZanixBaseFolder>> | undefined = undefined,
> = Omit<
  {
    readonly FOLDER: string
    get NAME(): string
    files: F
    subfolders: S
  },
  F extends undefined ? (S extends undefined ? 'subfolders' | 'files' : 'files')
    : (S extends undefined ? 'subfolders' : never)
>

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
    zanix: ZanixBaseFolder<{
      CONFIG: string
      SECRETS: string
    }>
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
    Record<string, string | null>,
    Record<string, ZanixBaseFolder>
  >
>

/** Zanix Server Folder structure */
export type ZanixServerSrcTree = ZanixBaseFolder<undefined, {
  connectors: ZanixBaseFolder<{
    EXAMPLE_PROVIDER: string
    EXAMPLE_CLIENT: string
  }>
  handlers: ZanixBaseFolder<{
    EXAMPLE_CONTROLLER: string
    EXAMPLE_RESOLVER: string
    EXAMPLE_SUBSCRIBER: string
  }, { rtos: ZanixBaseFolder<{ EXAMPLE: string }> }>
  interactors: ZanixBaseFolder<{ EXAMPLE_SERVICE: string }>
  jobs: ZanixBaseFolder<{ EXAMPLE: string }>
  repositories: ZanixBaseFolder<{
    EXAMPLE_DATA: string
    EXAMPLE_MODEL: string
  }, { seeders: ZanixBaseFolder<{ EXAMPLE: string }> }>
}>

/** Zanix Library Folder structure */
export type ZanixLibrarySrcTree = ZanixBaseFolder<
  { EXAMPLE: string },
  { templates: ZanixBaseFolder }
>

/**
 * Zanix App Folder structure
 * @experimental
 */
export type ZanixAppSrcTree = ZanixBaseFolder<undefined, {
  components: ZanixBaseFolder<{ EXAMPLE: string }>
  layout: ZanixBaseFolder<{ EXAMPLE: string }>
  pages: ZanixBaseFolder<{ EXAMPLE: string }>
  resources: ZanixBaseFolder<undefined, {
    intl: ZanixBaseFolder<undefined, { es: ZanixBaseFolder<{ EXAMPLE: string }> }>
    public: {
      FOLDER: string
      get NAME(): string
      subfolders: {
        assets: ZanixBaseFolder<undefined, {
          docs: ZanixBaseFolder<{ EXAMPLE: string }>
          fonts: ZanixBaseFolder<{ EXAMPLE: string }>
          icons: ZanixBaseFolder<{ EXAMPLE: string }>
          images: ZanixBaseFolder<{ EXAMPLE: string }>
          videos: ZanixBaseFolder<{ EXAMPLE: string }>
        }>
        scripts: ZanixBaseFolder<{ EXAMPLE: string }>
        sitemap: ZanixBaseFolder<{
          EXAMPLE_MAIN: string
          EXAMPLE_URL: string
        }>
        styles: ZanixBaseFolder<{ fonts: string }, {
          apps: ZanixBaseFolder<{ EXAMPLE: string }>
          global: ZanixBaseFolder<{ EXAMPLE: string }>
        }>
      }
    }
  }>
}>

/** Zanix general folders */
export type ZanixFolderTree<T extends ZanixProjectsFull = undefined> = ZanixBaseFolder<
  {
    MOD: string
    README: string
  },
  ZanixProjectSrc<T> & {
    dist: ZanixBaseFolder<{ APP: string }>
    docs: ZanixBaseFolder<{
      CHANGELOG: string
      LICENCE: string
    }>
    src: ZanixBaseFolder<
      undefined,
      ZanixSrcTree<T> & {
        tests: ZanixBaseFolder<undefined, {
          functional: ZanixBaseFolder<{ EXAMPLE: string }>
          integration: ZanixBaseFolder<{ EXAMPLE: string }>
          unit: ZanixBaseFolder<{ EXAMPLE: string }>
        }>
        shared: ZanixBaseFolder<
          undefined,
          T extends 'library' ? never : T extends undefined ? {} : {
            middlewares: ZanixBaseFolder<{
              EXAMPLE_PIPE: string
              EXAMPLE_INTERCEPTOR: string
            }>
          }
        >
        typings: ZanixBaseFolder<{ INDEX: string }>
        utils: ZanixBaseFolder<{ EXAMPLE: string }>
      }
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
