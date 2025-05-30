import type { BaseEditorHelperOptions, EditorOptions } from 'typings/editor.ts'

import { fileExists, readFileFromCurrentUrl } from 'modules/helpers/files.ts'
import { getRootDir } from 'modules/helpers/paths.ts'
import { capitalize } from 'utils/strings.ts'
import logger from 'modules/logger/mod.ts'
import constants from 'utils/constants.ts'
import { join } from '@std/path'

/** Base function to create main file editor config */
export async function createEditorFileConfig(
  { type, ...options }: EditorOptions & BaseEditorHelperOptions,
  replaceContentCallback: (content: string) => string = (content) => content,
) {
  const editorName = capitalize(type)

  try {
    // Create content for the pre-commit hook
    let configContent = JSON.parse(
      replaceContentCallback(
        await readFileFromCurrentUrl(import.meta.url, `./settings/${type}.json`),
      ),
    )

    const { baseRoot = getRootDir() } = options

    const baseFolder = join(baseRoot, constants.editors[type].FOLDER)

    // Create the directory if it doesn't exist
    await Deno.mkdir(baseFolder, { recursive: true })

    // file dir
    const baseFileDir = `${baseFolder}/${constants.editors[type].FILENAME}`

    if (fileExists(baseFileDir)) {
      const currentContent = JSON.parse(await Deno.readTextFile(baseFileDir))
      configContent = { ...currentContent, ...configContent }
    }

    // Write the config file
    await Deno.writeTextFile(baseFileDir, JSON.stringify(configContent, null, 2))

    logger.success(`'${editorName}' configuration file created successfully!`, 'noSave')

    return true
  } catch (e) {
    logger.error(`'${editorName}' configuration file creation error`, e, 'noSave')

    return false
  }
}
