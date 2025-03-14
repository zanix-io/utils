import type { HookOptions } from 'typings/github.ts'

import { fileExists, folderExists, readFileFromCurrentUrl } from 'modules/helpers/files.ts'
import { getRelativePath, getRootDir } from 'modules/helpers/paths.ts'
import { capitalize } from 'utils/strings.ts'
import logger from 'modules/logger/mod.ts'
import constants from 'utils/constants.ts'

/** Base function to create a hook */
export async function createHook(
  options: HookOptions & {
    filename: 'pre-commit' | 'pre-push'
  },
  replaceContentCallback: (content: string) => string = (content) => content,
) {
  const root = getRootDir()
  const {
    baseFolder = `${root}/${constants.GITHUB_HOOKS_FOLDER}`,
    filename: script,
    createLink = true,
  } = options
  const mainScript = capitalize(script)

  try {
    // Create content for the pre-commit hook
    const hookContent = await readFileFromCurrentUrl(import.meta.url, `./scripts/${script}.base.sh`)

    // Create the .github/hooks directory if it doesn't exist
    await Deno.mkdir(baseFolder, { recursive: true })

    // file dir
    const baseFileDir = `${baseFolder}/${script}`

    // Write the pre-commit hook file
    await Deno.writeTextFile(baseFileDir, replaceContentCallback(hookContent))

    // Grant execute permissions to the pre-commit file
    const chmod = new Deno.Command('chmod', {
      args: ['+x', baseFileDir],
    })

    const chmodResult = await chmod.output()

    if (!chmodResult.success) {
      throw new Error('chmod command failed. Please check your folder permissions and try again.')
    }

    if (!folderExists(constants.GIT_HOOKS_FOLDER)) {
      logger.warn(
        `${constants.GIT_HOOKS_FOLDER} directory does not exist. Initializing Git repository...`,
      )

      // Execute `git init` for initializing the repo if does not exist.
      const gitInit = new Deno.Command('git', {
        args: ['init'],
      })

      const gitInitResult = await gitInit.output()
      if (!gitInitResult.success) {
        throw new Error(
          'Git initialization failed. Please check your Git installation and try again.',
        )
      }
    }

    const fileHook = `${constants.GIT_HOOKS_FOLDER}/${script}`

    if (createLink) {
      if (fileExists(fileHook)) {
        logger.warn(`${mainScript} file already exists. Deleting it...`)
        await Deno.remove(fileHook)
      }

      // Create a symbolic link in .git/hooks
      const ln = new Deno.Command('ln', {
        args: ['-s', getRelativePath(baseFileDir, fileHook).replace(/^\.\.\//, ''), fileHook],
      })

      const lnResult = await ln.output()

      if (!lnResult.success) {
        throw new Error(
          'Symbolic link creation failed. Please check your Git hooks folder, remove current file and try again.',
        )
      }
    }

    logger.success(`'${mainScript}' hook created successfully!`, 'noSave')

    return true
  } catch (e) {
    logger.error(`'${mainScript}' hook creation error in '${baseFolder}'`, e, 'noSave')

    return false
  }
}
