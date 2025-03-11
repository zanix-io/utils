import type { EditorOptions } from 'typings/editor.ts'

import { getPathFromCurrent } from 'modules/helpers/paths.ts'
import logger from 'modules/logger/mod.ts'
import { capitalize } from 'utils/strings.ts'
import { editors } from 'utils/constants.ts'
import { fileExists } from 'modules/helpers/files.ts'

/** Base function to create main file editor config */
export async function createEditorFileConfig(
  { type }: EditorOptions,
  replaceContentCallback: (content: string) => string = (content) => content,
) {
  const editorName = capitalize(type)

  try {
    // Create content for the pre-commit hook
    let configContent = JSON.parse(
      replaceContentCallback(
        await Deno.readTextFile(
          getPathFromCurrent(import.meta.url, `./settings/${type}.json`),
        ),
      ),
    )
    const baseFolder = editors[type].FOLDER

    // Create the directory if it doesn't exist
    await Deno.mkdir(baseFolder, { recursive: true })

    // file dir
    const baseFileDir = `${baseFolder}/${editors[type].FILENAME}`

    if (fileExists(baseFileDir)) {
      const currentContent = JSON.parse(await Deno.readTextFile(baseFileDir))
      configContent = { ...currentContent, ...configContent }
    }

    // Write the config file
    await Deno.writeTextFile(baseFileDir, JSON.stringify(configContent, null, 2))

    logger.success(`${editorName} config created successfully!`, 'noSave')

    return true
  } catch (e) {
    logger.error(`${editorName} config creation error`, e, 'noSave')

    return false
  }
}
