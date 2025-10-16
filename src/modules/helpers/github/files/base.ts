import type { BaseGithubHelperOptions } from 'typings/github.ts'

import { fileExists, readFileFromCurrentUrl } from 'modules/helpers/files.ts'
import { getRootDir } from 'modules/helpers/paths.ts'
import logger from 'modules/logger/mod.ts'
import { join } from '@std/path'

/**
 * Generates a base file.
 *
 * @param options The create file options.
 *   - `baseRoot`: The base root directory where the folder should be created. Defaults to root.
 *   - `baseFile`: The base file to create
 *   - `filename`: The file name for the creation
 *
 * @category helpers
 */
export async function createBaseFile(
  options: Omit<BaseGithubHelperOptions, 'baseFolder'> & { baseFile: string; filename: string },
): Promise<boolean> {
  const { baseRoot = getRootDir(), baseFile, filename } = options
  try {
    // get content for the base file
    const fileContent = await readFileFromCurrentUrl(import.meta.url, join('base', baseFile))

    // Create the custom base directory if it doesn't exist
    if (baseRoot) {
      await Deno.mkdir(baseRoot, { recursive: true })
    }

    const fileDir = join(baseRoot, filename)

    if (fileExists(fileDir)) {
      logger.warn(`'${filename}' file already exists, skipping creation.`)

      return false
    }

    // Write the file in root
    await Deno.writeTextFile(fileDir, fileContent)

    logger.success(`'${filename}' file created successfully!`, 'noSave')

    return true
  } catch (e) {
    logger.error(`'${filename}' file creation error in '${baseRoot}'`, e, 'noSave')

    return false
  }
}
