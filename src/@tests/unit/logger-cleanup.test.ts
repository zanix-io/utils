import { assert } from '@std/assert'
import { getTemporaryFolder } from 'modules/helpers/paths.ts'
import { cleanupExpiredLogs } from 'modules/logger/defaults/storage/cleanup.ts'
import { fileExists } from 'modules/helpers/files.ts'

Deno.test('cleanupExpiredLogs skips directories found inside the logs folder', async () => {
  const logsDir = getTemporaryFolder(import.meta.url) + '/logs'
  const subDir = logsDir + '/nested-dir'
  await Deno.mkdir(subDir, { recursive: true })

  const expiredFile = logsDir + '/' + 'log-2000-01-01.json'
  await Deno.writeTextFile(expiredFile, 'data-log')

  await cleanupExpiredLogs(logsDir, '1d')

  const subDirStat = await Deno.stat(subDir)
  assert(subDirStat.isDirectory) // the directory itself must survive, not be treated as a file
  assert(!fileExists(expiredFile))

  await Deno.remove(logsDir, { recursive: true })
})
