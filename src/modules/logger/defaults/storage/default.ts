import type { DefaultResponse, SaveDataFile, SaveDataFunction } from 'typings/logger.ts'

import { WorkerManager } from 'modules/workers/mod.ts'
import { cleanupExpiredLogs } from './cleanup.ts'
import { getLogFileName } from './file.ts'
import { join } from '@std/path'

/**
 * Default save data function
 */
export const defaultSaveData: SaveDataFunction<
  DefaultResponse,
  SaveDataFile & { _fmtLog?: unknown }
> = async (context) => {
  // Adaptation for worker-based execution.
  // If `useWorker` is enabled, extract the callback from the context and prepare the formatted logger.
  // The callback is removed from the context to avoid duplication.
  if (context.useWorker) {
    const { callback } = context
    delete context.callback
    const _fmtLog = context.getFmtLog()
    const worker = new WorkerManager()

    return worker.task(defaultSaveData, {
      metaUrl: import.meta.url,
      onFinish: callback,
      autoClose: true,
    })
      .invoke({
        ...context,
        getFmtLog: undefined as never,
        useWorker: false, // ensure 'false' to avoid loops
        _fmtLog,
      })
  }

  const data = context._fmtLog || context.getFmtLog()
  const logsDir = context.folder || './.logs'
  const expirationTime = context.expirationTime || '5d'

  // Clean up expired log files after each log
  await cleanupExpiredLogs(logsDir, expirationTime)

  const file = join(logsDir, getLogFileName())

  return Deno.readTextFile(file).then((fileContent) => {
    const currentData = JSON.parse(fileContent)
    currentData.push(data)
    return Deno.writeTextFile(file, JSON.stringify(currentData, null, 2))
  }).catch(() => Deno.writeTextFile(file, JSON.stringify([data], null, 2)))
}

/**
 * Wraps `defaultSaveData` with a `SaveDataFile` config object — the `LoggerFileOptions` shape
 * `Logger`'s own `storage.save` also accepts, resolved into a real `SaveDataFunction` explicitly
 * by whichever entrypoint wants file-based storage (`modules/logger/mod.ts`'s own default
 * instance, or any server-side caller), rather than automatically inside `Logger`'s own
 * constructor — see `modules/logger/main.ts`'s own doc for why that split exists (this file is
 * the ONLY one in the `logger` module allowed to import `WorkerManager`; `main.ts` itself must
 * stay reachable from a browser client bundle without ever touching it, even indirectly).
 */
export function saveDataFileFunction(
  saveDataFunction: SaveDataFile,
): SaveDataFunction<DefaultResponse> {
  return (context) => defaultSaveData({ ...context, ...saveDataFunction })
}
