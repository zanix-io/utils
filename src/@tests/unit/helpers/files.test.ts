import { collectFiles, fileExists } from 'modules/helpers/files.ts'
import { assertArrayIncludes, assertEquals } from '@std/assert'
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

Deno.test('collectFiles: accepts an array of roots and finds matches across all of them', () => {
  const dirA = Deno.makeTempDirSync()
  const dirB = Deno.makeTempDirSync()

  Deno.writeTextFileSync(join(dirA, 'a.gql'), 'content of a.gql')
  Deno.writeTextFileSync(join(dirA, 'ignored.txt'), 'ignored')
  Deno.writeTextFileSync(join(dirB, 'b.graphql'), 'content of b.graphql')

  const foundFiles: { path: string; content: string }[] = []

  collectFiles([dirA, dirB], ['.gql', '.graphql'], (path, content) => {
    foundFiles.push({ path, content })
  })

  assertEquals(foundFiles.length, 2)
  assertArrayIncludes(
    foundFiles.map((p) => p.path.replace(/\\/g, '/')),
    [`${dirA}/a.gql`.replace(/\\/g, '/'), `${dirB}/b.graphql`.replace(/\\/g, '/')],
  )

  Deno.removeSync(dirA, { recursive: true })
  Deno.removeSync(dirB, { recursive: true })
})
