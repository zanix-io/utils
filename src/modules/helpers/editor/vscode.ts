import { createEditorFileConfig } from 'modules/helpers/editor/main.ts'
import { getConfigDir } from 'modules/helpers/paths.ts'

/**
 * Creates a `VSCode` configuration file (`settings.json`) for the current project.
 * This function generates a configuration file specifically tailored for use with VSCode.
 *
 * @category helpers
 */
export function createVSCodeConfig(): Promise<boolean> {
  const config = getConfigDir()?.split('/').pop()
  return createEditorFileConfig(
    { type: 'vscode' },
    (content) => content.replace('$DENO_CONFIG', config || 'deno.json'),
  )
}
