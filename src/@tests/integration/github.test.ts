import { createPreCommitHook } from 'modules/helpers/github/hooks/pre-commit.ts'
import { createPrePushHook } from 'modules/helpers/github/hooks/pre-push.ts'
import { createGitWorkflow } from 'modules/helpers/github/workflows/publish.ts'
import { prepareGithub } from 'modules/helpers/github/prepare.ts'
import { createIgnoreBaseFile } from 'modules/helpers/mod.ts'
import { getTemporaryFolder } from 'modules/helpers/paths.ts'
import { fileExists, folderExists } from 'modules/helpers/files.ts'
import { assert, assertExists } from '@std/assert'
import { stub } from '@std/testing/mock'

const defaultFolder = getTemporaryFolder(import.meta.url) + '/github'

// Disable console
stub(console, 'info')
stub(console, 'error')
stub(console, 'warn')

Deno.test('Github create pre-commit hook validation', async () => {
  // Call the function passing the file type, for example 'ts'
  const response = await createPreCommitHook({
    baseFolder: defaultFolder,
    baseRoot: '',
    createLink: false,
    filePatterns: {
      lint: [
        'ts',
      ],
      fmt: ['ts', 'md'],
    },
  })
  assert(response)
  assertExists(fileExists(defaultFolder + '/pre-commit'))

  await Deno.remove(defaultFolder, { recursive: true })
})

Deno.test('Github create pre-push hook validation', async () => {
  // Call the function passing the file type, for example 'ts'
  const response = await createPrePushHook({
    baseFolder: defaultFolder,
    baseRoot: '',
    createLink: false,
  })
  assert(response)
  assertExists(fileExists(defaultFolder + '/pre-push'))

  await Deno.remove(defaultFolder, { recursive: true })
})

Deno.test('Github create publish workflow yaml validation', async () => {
  // Call the function passing the file type, for example 'ts'
  const response = await createGitWorkflow({
    baseFolder: defaultFolder,
    baseRoot: '',
    mainBranch: 'myCustomBranch',
  })
  assert(response)

  const content = await Deno.readTextFile(defaultFolder + '/publish.yml')

  assert(content.includes('- myCustomBranch'))

  await Deno.remove(defaultFolder, { recursive: true })
})

Deno.test('Github create gitignorefile validation', async () => {
  // Call the function passing the file type, for example 'ts'
  const response = await createIgnoreBaseFile({ baseRoot: defaultFolder })
  assert(response)

  assertExists(fileExists(defaultFolder + '/.gitignore'))

  await Deno.remove(defaultFolder, { recursive: true })
})

Deno.test('Github prepare validation', async () => {
  const baseFolder = defaultFolder + '/prepare'
  // Call the function passing the file type, for example 'ts'
  const response = await prepareGithub({
    preCommitHook: { baseFolder, baseRoot: '', createLink: false },
    pushHook: { baseFolder, baseRoot: '', createLink: false },
    publishWorkflow: { baseFolder, baseRoot: '' },
    gitIgnoreBase: { baseRoot: baseFolder },
  })
  assert(response)

  assertExists(fileExists(baseFolder + '/pre-commit'))
  assertExists(fileExists(baseFolder + '/pre-push'))
  assertExists(fileExists(baseFolder + '/publish.yml'))
  await Deno.remove(defaultFolder, { recursive: true })
})

Deno.test('Git init should be executed', async () => {
  const response = await createPreCommitHook({
    baseFolder: '',
    baseRoot: defaultFolder,
  })

  assert(response)
  assert(folderExists(defaultFolder + '/.git'))

  await Deno.remove(defaultFolder, { recursive: true })
})
