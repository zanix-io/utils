import type { WorkflowOptions, WorkFlowTypes } from 'typings/github.ts'

import { readFileFromCurrentUrl } from 'modules/helpers/files.ts'
import { getRootDir } from 'modules/helpers/paths.ts'
import { capitalize } from 'utils/strings.ts'
import logger from 'modules/logger/mod.ts'
import constants from 'utils/constants.ts'

/** Base function to create a YAML workflow file */
export async function createWorkflow(
  options: WorkflowOptions & {
    filename: WorkFlowTypes
  },
  replaceContentCallback: (content: string) => string = (content) => content,
) {
  if (!options.filename) {
    logger.info('No workflow YAML file found for this project, unable to create', 'noSave')
    return false
  }

  const root = getRootDir()
  const { baseFolder = `${root}/${constants.GITHUB_WORKFLOW_FOLDER}`, filename: yml } = options
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
