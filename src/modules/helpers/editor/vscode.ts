import { createEditorFileConfig } from 'modules/helpers/editor/main.ts'
import { getConfigDir } from 'modules/helpers/paths.ts'

export function createVSCodeConfig(): Promise<boolean> {
  const config = getConfigDir()?.split('/').pop()
  return createEditorFileConfig(
    { type: 'vscode' },
    (content) => content.replace('$DENO_CONFIG', config || 'deno.json'),
  )
}
