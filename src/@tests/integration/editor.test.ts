import { createVSCodeConfig } from 'modules/helpers/editor/vscode.ts'
import { getTemporaryFolder } from 'modules/helpers/paths.ts'
import { assert } from '@std/assert/assert'
import constants from 'utils/constants.ts'
import { stub } from '@std/testing/mock'

const defaultFolder = getTemporaryFolder(import.meta.url) + '/editor'

// Disable console
stub(console, 'info')
stub(console, 'error')
stub(console, 'warn')

Deno.test('Editor config creation validation', async () => {
  const cwdMock = stub(Deno, 'cwd', () => '')

  const currentEditor = { ...constants.editors.vscode }
  constants.editors.vscode = { FOLDER: defaultFolder, FILENAME: 'settings' }

  const response = await createVSCodeConfig()

  const content = await Deno.readTextFile(defaultFolder + '/settings')
  assert(response)
  assert(content.includes('"deno.config": "deno.json'))
  await Deno.remove(defaultFolder, { recursive: true })

  constants.editors.vscode = currentEditor

  cwdMock.restore()
})
