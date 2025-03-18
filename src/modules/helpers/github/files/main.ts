import type { BaseGithubHelperOptions } from 'typings/github.ts'

import { fileExists, readFileFromCurrentUrl } from 'modules/helpers/files.ts'
import { getRootDir } from 'modules/helpers/paths.ts'
import logger from 'modules/logger/mod.ts'

/**
 * Generates a base `.gitignore` file to exclude common files and directories from being versioned in a Git repository.
 *
 * @param options The create file options.
 *   - `baseRoot`: The base root directory where the folder should be created. Defaults to root.
 *
 * @category helpers
 */
export async function createIgnoreBaseFile(
  options: Omit<BaseGithubHelperOptions, 'baseFolder'> = {},
): Promise<boolean> {
  const { baseRoot = getRootDir() } = options
  try {
    // get content for the ignore base file
    const hookContent = await readFileFromCurrentUrl(import.meta.url, './ignore.base')

    // Create the custom base directory if it doesn't exist
    if (baseRoot) {
      await Deno.mkdir(baseRoot, { recursive: true })
    }

    const fileDir = baseRoot + '/.gitignore'

    if (fileExists(fileDir)) {
      logger.warn(`'gitignore' file already exists, skipping creation.`)

      return false
    }

    // Write the .gitignore file in root
    await Deno.writeTextFile(fileDir, hookContent)

    logger.success(`'.gitignore' file created successfully!`, 'noSave')

    return true
  } catch (e) {
    logger.error(`'.gitignore' file creation error in '${baseRoot}'`, e, 'noSave')

    return false
  }
}
