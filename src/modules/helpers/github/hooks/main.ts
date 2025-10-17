import type { HookOptions } from 'typings/github.ts'

import { fileExists, folderExists, readFileFromCurrentUrl } from 'modules/helpers/files.ts'
import { getRelativePath, getRootDir } from 'modules/helpers/paths.ts'
import { capitalize } from 'utils/strings.ts'
import logger from 'modules/logger/mod.ts'
import constants from 'utils/constants.ts'
import { join } from '@std/path'

let baseGitFolder: string

/** Base git init function */
export async function gitInitialization(baseRoot: string = getRootDir()) {
  const gitFolder = join(baseRoot, constants.GIT_HOOKS_FOLDER)

  if (!folderExists(gitFolder)) {
    logger.warn(
      `${constants.GIT_HOOKS_FOLDER} directory does not exist. Initializing Git repository...`,
    )

    // Execute `git init` for initializing the repo if does not exist.
    const gitInit = new Deno.Command('git', {
      args: ['init', baseRoot],
    })

    const gitInitResult = await gitInit.output()
    if (!gitInitResult.success) {
      throw new Error(
        'Git initialization failed. Please check your Git installation and try again `git init` command.',
      )
    }
  }

  baseGitFolder = gitFolder

  return baseGitFolder
}

/** Base function to create a hook */
export async function createHook(
  options: HookOptions & {
    filename: 'pre-commit' | 'pre-push'
  },
  replaceContentCallback: (content: string) => string = (content) => content,
) {
  const {
    baseFolder = constants.GITHUB_HOOKS_FOLDER,
    filename: script,
    createLink = true,
    baseRoot = getRootDir(),
  } = options
  const mainScript = capitalize(script)
  const dir = join(baseRoot, baseFolder)

  try {
    // Create content for the pre-commit hook
    const hookContent = await readFileFromCurrentUrl(import.meta.url, `./scripts/${script}.base.sh`)

    // Create the .github/hooks directory if it doesn't exist
    await Deno.mkdir(dir, { recursive: true })

    // file dir
    const baseFileDir = `${dir}/${script}`

    if (fileExists(baseFileDir)) {
      logger.warn(`${mainScript} file already exists, skipping creation.`)

      return false
    }

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

    if (!baseGitFolder) {
      throw new Error(
        'Please verify your Git initialization and try running the znx prepare command again.',
      )
    }

    const fileHook = join(baseGitFolder, script)

    if (createLink) {
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
    logger.error(`'${mainScript}' hook creation error in '${dir}'`, e, 'noSave')

    return false
  }
}
