import type { WorkflowOptions } from 'typings/github.ts'

import { readFileFromCurrentUrl } from 'modules/helpers/files.ts'
import { GITHUB_WORKFLOW_FOLDER } from 'utils/constants.ts'
import { getRootDir } from 'modules/helpers/paths.ts'
import logger from 'modules/logger/mod.ts'
import { capitalize } from 'utils/strings.ts'

/** Base function to create a YAML workflow file */
export async function createWorkflow(
  options: WorkflowOptions & {
    filename: 'publish'
  },
  replaceContentCallback: (content: string) => string = (content) => content,
) {
  const root = getRootDir()
  const { baseFolder = `${root}/${GITHUB_WORKFLOW_FOLDER}`, filename: yml } = options
  const mainYamls = capitalize(yml)

  try {
    // Create content for the pre-commit hook
    const hookContent = await readFileFromCurrentUrl(import.meta.url, `./yamls/${yml}.base.yml`)

    // Create the .github/workflow directory if it doesn't exist
    await Deno.mkdir(baseFolder, { recursive: true })

    // file dir
    const baseFileDir = `${baseFolder}/${yml}.yml`

    // Write the YAML file
    await Deno.writeTextFile(baseFileDir, replaceContentCallback(hookContent))

    logger.success(`'${mainYamls}' YAML created successfully!`, 'noSave')

    return true
  } catch (e) {
    logger.error(`'${mainYamls}' YAML creation error in '${baseFolder}'`, e, 'noSave')

    return false
  }
}
