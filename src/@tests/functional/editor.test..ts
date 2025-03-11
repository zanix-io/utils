import { getTemporaryFolder } from 'modules/helpers/paths.ts'
import { stub } from '@std/testing/mock'
import { createVSCodeConfig } from 'modules/helpers/editor/vscode.ts'
import { editors } from 'utils/constants.ts'
import { assert } from '@std/assert/assert'

const defaultFolder = getTemporaryFolder(import.meta.url) + '/editor'

// Disable console
stub(console, 'info')
stub(console, 'error')
stub(console, 'warn')

Deno.test('Editor config creation validation', async () => {
  const currentEditor = { ...editors.vscode }
  editors.vscode = { FOLDER: defaultFolder, FILENAME: 'settings' }

  const response = await createVSCodeConfig()

  const content = await Deno.readTextFile(defaultFolder + '/settings')
  assert(response)
  assert(content.includes('"deno.config": "deno.json'))
  await Deno.remove(defaultFolder, { recursive: true })

  editors.vscode = currentEditor
})
