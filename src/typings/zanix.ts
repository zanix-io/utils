import type { Logger } from 'modules/logger/main.ts'

/** The default `Logger` instance shape exposed via `Znx.logger`. */
export type DefaultLogger = typeof Logger['prototype']

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
 * `ZanixProjects` plus the `'all'` and `undefined` (common-structure) cases.
 * @deprecated The real scaffold-tree modeling this supported moved to `@zanix/cli`'s own
 * `src/typings/tree.ts`, which was always its only real consumer. Kept here, simplified to this
 * plain union, only so an existing `import type { ZanixProjectsFull }` doesn't break; get the real
 * type from `@zanix/cli` going forward. Will be removed in a future major release.
 */
export type ZanixProjectsFull = ZanixProjects | 'all' | undefined

/**
 * Zanix templates available for automated file generation.
 * @deprecated Superseded by `@zanix/cli`'s own `src/typings/tree.ts`. Kept here, widened to a
 * plain `string`, only so an existing `import type { ZanixTemplates }` doesn't break. Will be
 * removed in a future major release.
 */
export type ZanixTemplates = string

/**
 * Context passed to a template's `content` resolver function.
 * @deprecated Superseded by `@zanix/cli`'s own `src/typings/tree.ts`. Kept here, widened to a
 * generic record, only so an existing `import type { ZanixLocalContentProps }` doesn't break. Will
 * be removed in a future major release.
 */
// deno-lint-ignore no-explicit-any
export type ZanixLocalContentProps = Record<string, any>

/**
 * A record of generated template files, grouped by template category.
 * @deprecated Superseded by `@zanix/cli`'s own `src/typings/tree.ts`. Kept here, widened to a
 * generic record, only so an existing `import type { ZanixTemplatesRecord }` doesn't break. Will be
 * removed in a future major release.
 */
// deno-lint-ignore no-explicit-any
export type ZanixTemplatesRecord = Record<string, any>

/**
 * The base fields present on every Zanix folder-tree node.
 * @deprecated Superseded by `@zanix/cli`'s own `src/typings/tree.ts`. Kept here, simplified to a
 * generic shape, only so an existing `import type { ZanixBaseFolderProps }` doesn't break. Will be
 * removed in a future major release.
 */
export type ZanixBaseFolderProps<S = unknown> = {
  readonly FOLDER: string
  readonly NAME: string
  templates?: ZanixTemplatesRecord
  subfolders?: S
}

/**
 * The recursive folder-tree shape shared by all Zanix folder structures.
 * @deprecated Superseded by `@zanix/cli`'s own `src/typings/tree.ts`. Kept here, simplified to a
 * plain generic (no longer the real `noTemplates`/required-`subfolders` conditional logic), only so
 * an existing `import type { ZanixBaseFolder }` doesn't break. Will be removed in a future major
 * release.
 */
export type ZanixBaseFolder<S = Record<string, unknown>> = Partial<ZanixBaseFolderProps<S>>

/**
 * A generic folder structure modeling a file system where each folder can recursively contain
 * subfolders and files.
 * @deprecated Superseded by `@zanix/cli`'s own `src/typings/tree.ts`. Will be removed in a future
 * major release.
 */
export type ZanixFolderGenericTree = ZanixBaseFolder<Record<string, ZanixBaseFolder>>

/**
 * Zanix Server folder structure.
 * @deprecated Superseded by `@zanix/cli`'s own `src/typings/tree.ts`, which models the real,
 * current server folder shape. This alias is kept only for import compatibility and no longer
 * reflects the actual scaffold. Will be removed in a future major release.
 */
export type ZanixServerSrcTree = ZanixFolderGenericTree

/**
 * Zanix Library folder structure.
 * @deprecated Superseded by `@zanix/cli`'s own `src/typings/tree.ts`. This alias is kept only for
 * import compatibility and no longer reflects the actual scaffold. Will be removed in a future
 * major release.
 */
export type ZanixLibrarySrcTree = ZanixFolderGenericTree

/**
 * Zanix Space folder structure.
 * @deprecated Superseded by `@zanix/cli`'s own `src/typings/tree.ts`, which models the real,
 * current space folder shape (`routes/`, `comets/`). This alias is kept only for import
 * compatibility and no longer reflects the actual scaffold. Will be removed in a future major
 * release.
 */
export type ZanixSpaceSrcTree = ZanixFolderGenericTree

/**
 * Maps each Zanix project type to its `src` subfolder shape.
 * @deprecated Superseded by `@zanix/cli`'s own `src/typings/tree.ts`. Kept here, widened to a
 * generic record, only so an existing `import type { ZanixSrcTreeMap }` doesn't break. Will be
 * removed in a future major release.
 */
// deno-lint-ignore no-explicit-any
export type ZanixSrcTreeMap = Record<string, any>

/**
 * Resolves the `src` subfolder shape for a given Zanix project type.
 * @deprecated Superseded by `@zanix/cli`'s own `src/typings/tree.ts`. Will be removed in a future
 * major release.
 */
export type ZanixSrcTree<T extends ZanixProjectsFull = undefined> = T extends keyof ZanixSrcTreeMap
  ? ZanixSrcTreeMap[T]
  : ZanixFolderGenericTree

/**
 * The complete Zanix project folder tree (root-level), parameterized by project type.
 * @deprecated Superseded by `@zanix/cli`'s own `src/typings/tree.ts`. Kept here, simplified to a
 * plain generic tree, only so an existing `import type { ZanixFolderTree }` doesn't break. Will be
 * removed in a future major release.
 */
export type ZanixFolderTree<T extends ZanixProjectsFull = undefined> = ZanixBaseFolder<
  Record<string, ZanixBaseFolder> & ZanixSrcTree<T>
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
