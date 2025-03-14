import type { ZanixFolderTree, ZanixProjectsFull } from 'typings/zanix.ts'

import { getZnxFolderTree } from './projects/main.ts'
import { getRootDir } from 'modules/helpers/paths.ts'

/**
 * Retrieves the recommended folder structure for `Zanix` projects based on the provided type.
 *
 * @template T - A generic type parameter that must extend `ZanixProjects`.
 *
 * @param type - The type of the structure to retrieve.
 *                Use `server` to get the backend API folder structure, `app`
 *                to get the frontend SSR folder structure, or `library`.
 *
 *                If you want to get `server` and `app` together, send `app-server` type.
 *
 *                Defaults (undefined) to sending the common structure.
 *
 * @param projectDir - The custom project dir `cwd`. Defaults to initial root.
 *
 * @returns A nested object representing the folder structure for the given type.
 *
 * This function requires the following permissions:
 * `allow-read` for `deno` config json file.
 *
 * @tags `allow-read`
 * @category helpers
 *
 * @experimental
 */
export function getZanixPaths<
  T extends ZanixProjectsFull = undefined,
>(type?: T, projectDir?: string): ZanixFolderTree<T> {
  return getZnxFolderTree(`${projectDir ?? getRootDir()}`, type)
}

/**
 * Gets the `source` directory `path` (assuming it is always at the root level for Zanix projects)
 *
 * @category helpers
 */
export function getSrcDir(): string {
  return getZanixPaths().subfolders.src.FOLDER
}

/**
 * Gets the `source` directory `name` for Zanix projects
 *
 * @category helpers
 */
export function getSrcName(): string {
  return getZanixPaths().subfolders.src.NAME
}
