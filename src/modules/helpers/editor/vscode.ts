import type { BaseEditorHelperOptions } from 'typings/editor.ts'

import { createEditorFileConfig } from 'modules/helpers/editor/main.ts'
import { getConfigDir } from 'modules/helpers/paths.ts'

/**
 * Creates a `VSCode` configuration file (`settings.json`) for the current project.
 * This function generates a configuration file specifically tailored for use with VSCode.
 *
 * @param options The editor helper options
 *   - `baseRoot`: The base root directory where the folder should be created. Defaults to root.
 *
 * @category helpers
 */
export function createVSCodeConfig(options?: BaseEditorHelperOptions): Promise<boolean> {
  const config = getConfigDir()?.split('/').pop()
  return createEditorFileConfig(
    { type: 'vscode', ...options },
    (content) => content.replace('$DENO_CONFIG', config || 'deno.json'),
  )
}
