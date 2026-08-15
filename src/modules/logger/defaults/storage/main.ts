import type { DefaultResponse, SaveDataFile, SaveDataFunction } from 'typings/logger.ts'

import { showMessage } from 'modules/logger/base.ts'
import { serializeError } from 'modules/errors/serialize.ts'
import { createRedactor } from 'modules/errors/redact.ts'
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
 * Function to handle the log data and append it to the log file
 */
export function baseSaveData(
  saveDataFunction?: SaveDataFile | SaveDataFunction | false,
  redact: ReturnType<typeof createRedactor> = createRedactor(),
): SaveDataFunction {
  // Zanix libraries won't save logs unless a custom `saveDataFunction` is provided. A
  // `defineZanixApp()` package ('app') gets the same treatment — like a library, it isn't
  // necessarily a deployed long-running process on its own (a real host runs it, e.g. via
  // `Zanix.start()`/`.serve()`), so it shouldn't assume a log file destination either.
  if (
    (Znx.config.project === 'library' || Znx.config.project === 'app') &&
    !saveDataFunction
  ) {
    return () => {}
  }

  let baseContext: SaveDataFile = {}
  if (typeof saveDataFunction !== 'function') {
    baseContext = typeof saveDataFunction !== 'string' ? { ...saveDataFunction } : {}
    saveDataFunction = defaultSaveData
  }

  const catcher = (e: unknown) =>
    showMessage(
      'warn',
      '[Logger]: Custom save data function failed. The log could not be saved.',
      // `serializeError`'s own `redact: false` avoids re-redacting `e` with its unrelated default
      // pattern — `redact(...)` below applies this instance's own configured one, once, to the
      // whole payload.
      redact({ cause: serializeError(e, { redact: false }) }),
    )

  return (context) => {
    try {
      const response = saveDataFunction({ ...context, ...baseContext })
      if (response instanceof Promise) return response.catch(catcher)
      return response
    } catch (e) {
      catcher(e)
    }
  }
}
