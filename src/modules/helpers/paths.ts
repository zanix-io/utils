import { basename, fromFileUrl, join, relative, resolve, SEPARATOR } from '@std/path'
import { CONFIG_FILE } from 'utils/constants.ts'
import { fileExists } from './files.ts'
import { isFileUrl } from 'utils/urls.ts'
import { assertDenoRuntime } from 'utils/runtime.ts'
import { ApplicationError } from 'modules/errors/main.ts'

/**
 * Gets the root directory of the project
 *
 * @category helpers
 */
export function getRootDir(): string {
  assertDenoRuntime('getRootDir')
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
export function getPathFromCurrent(
  callerUrl: string,
  relativePath: string,
): string {
  const path = join(callerUrl, '..', relativePath)

  if (isFileUrl(callerUrl)) return fromFileUrl(path)

  return path
}

/**
 * Resolves `key` against `rootDir` and rejects the result if it lands outside `rootDir` — the
 * guard any storage/filesystem layer needs before touching disk with a caller-supplied `key`
 * (or an id used to build one): `../` segments and an absolute `key` both escape containment the
 * same way, since resolving an absolute `key` against `rootDir` simply overrides `rootDir`
 * entirely rather than nesting under it — so both are caught by the one containment check below,
 * neither treated as a special case. `key` resolving to `rootDir` itself (an empty/`.` key) is
 * also rejected: a storage `key` always names something INSIDE the root, never the root.
 *
 * @param rootDir - The directory `key` must resolve strictly inside of. Relative or absolute.
 * @param key - The caller-supplied path segment to confine — never trusted to already be safe.
 * @returns The resolved, absolute path — safe to pass to any `Deno.*` filesystem call.
 * @throws {ApplicationError} If the resolved path is `rootDir` itself or outside it.
 *
 * @example
 * ```ts
 * confinePath('/data/objects', 'assets/1/original') // '/data/objects/assets/1/original'
 * confinePath('/data/objects', '../../etc/passwd')  // throws
 * confinePath('/data/objects', '/etc/passwd')       // throws
 * ```
 *
 * @category helpers
 */
export function confinePath(rootDir: string, key: string): string {
  const root = resolve(rootDir)
  const target = resolve(root, key)

  if (!target.startsWith(root + SEPARATOR)) {
    throw new ApplicationError(`Path traversal blocked: "${key}" resolves outside "${rootDir}"`, {
      code: 'UTILS_PATHS_TRAVERSAL_BLOCKED',
      meta: { rootDir, key },
    })
  }

  return target
}

/**
 * Gets a temporary (git-ignored) folder path based on the module's location.
 * If the folder does not exist, it is created automatically.
 *
 * @param callerUrl - The base path to create the temporary folder inside. Use `import.meta.url`.
 * @param unique - When set, returns a FRESH, uniquely-named subfolder inside `__tmp__` instead of
 * the fixed `__tmp__` path itself — a new folder every call, via `Deno.makeTempDirSync`. Needed
 * whenever more than one caller (or concurrent test run) needs its own isolated scratch space
 * inside `__tmp__` and must not collide with, or clobber via cleanup, another caller's files. A
 * string sets that subfolder's own name prefix; `true` uses no prefix.
 * @returns The absolute path of the temporary folder — the fixed `__tmp__` path, or a fresh
 * unique subfolder of it when `unique` is set.
 *
 * This folder is named `__tmp__` and is excluded from version control by default (e.g., added to .gitignore).
 *
 * @example
 * ```ts
 * // The fixed folder, shared by every caller at this location — the original behavior.
 * getTemporaryFolder(import.meta.url)
 *
 * // A fresh, isolated subfolder inside it — safe for concurrent/repeated use.
 * getTemporaryFolder(import.meta.url, 'fixture-')
 * ```
 *
 * @category helpers
 */
export function getTemporaryFolder(callerUrl: string, unique?: boolean | string): string {
  assertDenoRuntime('getTemporaryFolder')
  const temporalFolder = getPathFromCurrent(callerUrl, '__tmp__')
  Deno.mkdirSync(temporalFolder, { recursive: true })

  if (!unique) return temporalFolder

  return Deno.makeTempDirSync({
    dir: temporalFolder,
    prefix: typeof unique === 'string' ? unique : undefined,
  })
}
