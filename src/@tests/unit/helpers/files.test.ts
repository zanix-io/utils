import { assertEquals } from '@std/assert'
import { fileExists } from 'modules/helpers/files.ts'

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
