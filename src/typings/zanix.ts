import type { ZNX_STRUCT } from 'modules/helpers/zanix/folders/mod.ts'

type ZnxFolderStructure = typeof ZNX_STRUCT

type ZnxProjects = 'library' | 'server' | 'app' | 'app-server'

type ZnxSubfoldersRewrited<O extends ZnxProjects> = Omit<
  ZnxFolderStructure['subfolders']['src']['subfolders'],
  O
>

type ZnxFolderStructureModified<T extends ZnxProjects> = Omit<ZnxFolderStructure, 'subfolders'> & {
  subfolders: Omit<ZnxFolderStructure['subfolders'], 'src'> & {
    src: Omit<ZnxFolderStructure['subfolders']['src'], 'subfolders'> & {
      subfolders: 'library' extends T ? ZnxSubfoldersRewrited<'app' | 'server'>
        : T extends 'app' ? ZnxSubfoldersRewrited<'library' | 'server'>
        : T extends 'server' ? ZnxSubfoldersRewrited<'app' | 'library'>
        : ZnxSubfoldersRewrited<'library'>
    }
  }
}

/**
 * Defines the 'Projects' type, which is a reference to ZnxProjects
 * This type represents the available projects in Zanix.
 */
export type Projects = ZnxProjects
/**
 * Defines a generic 'FolderStructure' type that depends on the 'Projects' type
 * for Zanix applications.
 */
export type FolderStructure<T extends Projects = never> = T extends never ? ZnxFolderStructure
  : ZnxFolderStructureModified<T>
