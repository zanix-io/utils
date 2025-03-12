import { fileExists, readFileFromCurrentUrl } from 'modules/helpers/files.ts'
import { assert, assertEquals } from '@std/assert'

Deno.test('fileExists should return true if the file exists', () => {
  // Create a temporary file for testing
  const tempFilePath = './testFile.txt'
  Deno.writeTextFileSync(tempFilePath, 'Hello, Deno!') // Create file
  assertEquals(fileExists(tempFilePath), true) // Assert file exists

  // Clean up after test
  Deno.removeSync(tempFilePath)
})

Deno.test('fileExists should return false if the file does not exist', () => {
  const nonExistentFilePath = './nonExistentFile.txt'
  assertEquals(fileExists(nonExistentFilePath), false) // Assert file does not exist
})

Deno.test('readFileFromCurrentUrl should return a url file content', async () => {
  const remoteContent = await readFileFromCurrentUrl(
    'https://jsr.io/@zanix/utils/1.1.0/src/modules/helpers/github/hooks/scripts/any.txt',
    'pre-commit.base.sh',
  )

  assert(!remoteContent.includes('Not Found'))

  const localContent = await readFileFromCurrentUrl(
    import.meta.url,
    'files.test.ts',
  )

  assert(localContent.includes('Deno.test'))
})
