import { basename, fromFileUrl, join, relative } from '@std/path'
import { CONFIG_FILE } from 'utils/constants.ts'
import { fileExists } from './files.ts'
import { isFileUrl } from 'utils/urls.ts'

/**
 * Gets the root directory of the project
 *
 * @category helpers
 */
export function getRootDir(): string {
  return Deno.cwd()
}

/**
 * Gets the path to the `deno.json` configuration file
 *
 * @param root - The optional configuration file root dir.
 *
 * @category helpers
 */
export function getConfigDir(root?: string): string | null {
  const rootDir = root ?? getRootDir()
  const jsonFile = join(rootDir, CONFIG_FILE)
  const jsoncFile = join(rootDir, `${CONFIG_FILE}c`)

  if (fileExists(jsonFile)) return jsonFile
  if (fileExists(jsoncFile)) return jsoncFile

  return null
}

/**
 * Extracts the base folder name from a given URI.
 *
 * @param uri - The URI string from which the base folder name will be extracted.
 *
 * @category helpers
 */
export function getFolderName(uri: string): string {
  return basename(uri)
}

/**
 * Calculates the relative path from one directory to another.
 *
 * @param to - The target path to which you want to find the relative path.
 * @param from - The base directory from which the relative path will be calculated. Defaults to the root directory if not provided.
 *
 * @returns The relative path from the `from` directory to the `to` directory.
 *
 * @category helpers
 */
export function getRelativePath(to: string, from?: string): string {
  return relative(from || getRootDir(), to)
}

/**
 * Resolves a file path relative to the current executing script.
 *
 * This function correctly handles `import.meta.url` to get the directory
 * of the current module and resolves the provided relative path.
 *
 * @param callerUrl - The `import.meta.url` from the calling module.
 * @param relativePath - The relative file path to resolve.
 * @returns The absolute file path.
 *
 * @example
 * ```ts
 * getPathFromCurrent("file.txt") // Resolves to: /currentScriptDir/file.txt
 * ```
 *
 * @category helpers
 */
export function getPathFromCurrent(callerUrl: string, relativePath: string): string {
  const path = join(callerUrl, '..', relativePath)

  if (isFileUrl(callerUrl)) return fromFileUrl(path)

  return path
}

/**
 * Gets a temporary (git-ignored) folder path based on the module's location.
 * If the folder does not exist, it is created automatically.
 *
 * @param callerUrl - The base path to create the temporary folder inside. Use `import.meta.url`.
 * @returns The absolute path of the temporary folder.
 *
 * This folder is named `__tmp__` and is excluded from version control by default (e.g., added to .gitignore).
 *
 * @category helpers
 */
export function getTemporaryFolder(callerUrl: string): string {
  const temporalFolder = getPathFromCurrent(callerUrl, '__tmp__')
  Deno.mkdirSync(temporalFolder, { recursive: true })

  return temporalFolder
}
