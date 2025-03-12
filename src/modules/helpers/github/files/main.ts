import type { BaseGithubHelperOptions } from 'typings/github.ts'

import { readFileFromCurrentUrl } from 'modules/helpers/files.ts'
import { getRootDir } from 'modules/helpers/paths.ts'
import logger from 'modules/logger/mod.ts'

/**
 * Creates ignore base file
 *
 * This function generates a basic `.gitignore` file.
 *
 * @param options The create file options.
 *   - `baseFolder`: The folder where the `.gitignore` should be created. Defaults to `root`
 */
export async function createIgnoreBaseFile(
  options: BaseGithubHelperOptions = {},
): Promise<boolean> {
  const { baseFolder = getRootDir() } = options
  try {
    // get content for the ignore base file
    const hookContent = await readFileFromCurrentUrl(import.meta.url, './ignore.base')

    // Create the custom base directory if it doesn't exist
    if (options.baseFolder) {
      await Deno.mkdir(options.baseFolder, { recursive: true })
    }

    const fileDir = baseFolder + '/.gitignore'

    // Write the .gitignore file in root
    await Deno.writeTextFile(fileDir, hookContent)

    logger.success(`'.gitignore' file created successfully!`, 'noSave')

    return true
  } catch (e) {
    logger.error(`'.gitignore' file creation error in '${baseFolder}'`, e, 'noSave')

    return false
  }
}
