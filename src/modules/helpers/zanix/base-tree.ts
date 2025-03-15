import type {
  ZanixBaseFolder,
  ZanixFolderOptions,
  ZanixLibraries,
  ZanixLocalContentProps,
  ZanixTemplates,
  ZanixTemplatesRecord,
  ZanixTreeFolderOptions,
} from 'typings/zanix.ts'

import { getZanixTemplateContent } from 'modules/helpers/zanix/templates.ts'
import { join } from '@std/path'
import { getFolderName } from 'modules/helpers/paths.ts'

class BaseZanixTree<S extends ZanixBaseFolder> {
  #baseName: string
  constructor(private root: string) {
    this.#baseName = getFolderName(root)
  }

  /**
   * Function to create multiple folders structure
   * @param folders
   */
  // deno-lint-ignore no-explicit-any
  public generateTreeFolder(tree: any, path: string): S {
    path = join(path, tree.NAME || '')

    Object.assign(tree, this.createFolder({ ...tree, FOLDER: path } as never))

    if (tree.subfolders) {
      Object.entries<object>(tree.subfolders).forEach(([name, subfolder]) => {
        tree.subfolders[name] = this.generateTreeFolder({
          ...subfolder,
          NAME: name,
        }, path)
      })
    }

    return tree as S
  }

  /**
   * Function to create a folder structure.
   */
  private createFolder(
    options: Partial<ZanixFolderOptions> & { NAME: string; FOLDER: string },
  ): Partial<ZanixBaseFolder> {
    const { NAME = this.#baseName, templates, FOLDER } = options

    if (!templates) return { FOLDER, NAME }

    const baseTemplates = {} as ZanixTemplatesRecord
    Object.entries(templates).forEach(([name, options]) => {
      baseTemplates[name as ZanixTemplates] = this.createTemplates({
        ...options,
        folderPath: FOLDER,
      })
    })

    return {
      FOLDER,
      NAME,
      templates: baseTemplates,
    }
  }

  /**
   * Function to create a template
   */
  private createTemplates(
    options: { files: string[]; folderPath: string; jsr?: keyof ZanixLibraries },
  ) {
    const { files, jsr, folderPath } = options
    const root = this.root

    return files.map((file) => ({
      PATH: join(folderPath, file),
      NAME: file,
      content(local: ZanixLocalContentProps) {
        const { metaUrl, relativePath = '' } = local
        return getZanixTemplateContent({
          url: metaUrl,
          path: this.PATH.replace(root, jsr ? '/' : join(relativePath, '/')),
          jsr,
        })
      },
    }))
  }
}

/**
 * Class to generate a ZanixTreeFolder
 */
export class ZanixTree {
  public static create<S extends Partial<ZanixBaseFolder>>(
    root: string,
    tree: ZanixTreeFolderOptions<S>,
  ) {
    return new BaseZanixTree(root).generateTreeFolder(tree, root) as S
  }
}
