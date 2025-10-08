import { collectFiles, fileExists, readFileFromCurrentUrl } from 'modules/helpers/files.ts'
import { assert, assertArrayIncludes, assertEquals } from '@std/assert'
import { join } from '@std/path'
import { getTemporaryFolder } from 'modules/helpers/paths.ts'

const temporaryFolder = getTemporaryFolder(import.meta.url)

Deno.test('fileExists should return true if the file exists', () => {
  // Create a temporary file for testing
  const tempFilePath = `${temporaryFolder}/testFile.txt`
  Deno.writeTextFileSync(tempFilePath, 'Hello, Deno!') // Create file
  assertEquals(fileExists(tempFilePath), true) // Assert file exists

  // Clean up after test
  Deno.removeSync(tempFilePath)
})

Deno.test('fileExists should return false if the file does not exist', () => {
  const nonExistentFilePath = `${temporaryFolder}/nonExistentFile.txt`
  assertEquals(fileExists(nonExistentFilePath), false) // Assert file does not exist
})

Deno.test('readFileFromCurrentUrl should return a url file content', async () => {
  const remoteContent = await readFileFromCurrentUrl(
    'https://jsr.io/@zanix/utils/1.1.0/src/modules/helpers/github/hooks/scripts/any.txt',
    'pre-commit.base.sh',
  )

  assert(remoteContent !== '')

  const localContent = await readFileFromCurrentUrl(
    import.meta.url,
    'files.test.ts',
  )

  assert(localContent.includes('Deno.test'))
})

Deno.test('collectFiles: should find only .gql and .graphql files', () => {
  // Setup: Create files and folders
  const filesToCreate = [
    'a.gql',
    'b.graphql',
    'c.txt',
    'subdir/d.gql',
    'subdir/e.js',
  ]

  Deno.mkdirSync(join(temporaryFolder, 'subdir'))
  for (const relativePath of filesToCreate) {
    const fullPath = join(temporaryFolder, relativePath)
    Deno.writeTextFileSync(fullPath, `content of ${relativePath}`)
  }

  const foundFiles: { path: string; content: string }[] = []

  collectFiles(temporaryFolder, ['.gql', '.graphql'], (path, content) => {
    foundFiles.push({ path, content })
  })

  // Assert only correct files are collected
  assertEquals(foundFiles.length, 3)
  assertArrayIncludes(
    foundFiles.map((p) => p.path.replace(/\\/g, '/')), // normalize paths
    [
      `${temporaryFolder}/a.gql`,
      `${temporaryFolder}/b.graphql`,
      `${temporaryFolder}/subdir/d.gql`,
    ],
  )

  foundFiles.forEach((file) => {
    const path = file.path.replace(/\\/g, '/') // normalize paths
    assertEquals(file.content, `content of ${filesToCreate.find((p) => path.endsWith(p))}`)
  })

  Deno.removeSync(temporaryFolder, { recursive: true })
})
