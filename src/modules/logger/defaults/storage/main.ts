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
  const hasCustomSaveDataFunction = !!saveDataFunction
  const isFunction = typeof saveDataFunction === 'function'

  const baseContext: SaveDataFile = !isFunction
    ? (typeof saveDataFunction !== 'string' ? { ...saveDataFunction } : {})
    : {}
  // The explicit function, when one was given — never resolved to `defaultSaveData` here. Doing
  // that substitution eagerly (in this function's own synchronous body, not the closure below)
  // reintroduces a real bug: `Logger`'s own module creates a default instance on import
  // (`modules/logger/mod.ts`), which reaches this exact call — through a real circular import
  // (`defaults/storage/main.ts` -> `modules/workers/mod.ts` -> ... -> `modules/logger/mod.ts` ->
  // `modules/logger/main.ts` -> back to this file). Referencing `defaultSaveData` (declared
  // further down THIS file) while that cycle is still resolving throws
  // `ReferenceError: Cannot access 'defaultSaveData' before initialization` — confirmed by
  // reproducing it directly. Deferring the reference into the closure below, which only actually
  // runs at a real save (well after this module has finished initializing), avoids it.
  const customFn = isFunction ? saveDataFunction as SaveDataFunction : undefined

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
    // Zanix libraries won't save logs unless a custom `saveDataFunction` is provided. A
    // `defineZanixApp()` package ('app') gets the same treatment — like a library, it isn't
    // necessarily a deployed long-running process on its own (a real host runs it, e.g. via
    // `Zanix.start()`/`.serve()`), so it shouldn't assume a log file destination either.
    //
    // Checked here, at the first real save — not at `baseSaveData`'s own call time (i.e.
    // `Logger`'s constructor) — because `Znx.config` resolves lazily (see `setGlobalZnx`);
    // reading it here instead of eagerly is what keeps merely constructing a `Logger` (`Logger`'s
    // own module creates one on import) from forcing a synchronous config read off disk.
    if (
      (Znx.config.project === 'library' || Znx.config.project === 'app') &&
      !hasCustomSaveDataFunction
    ) {
      return
    }

    const saveDataFn = customFn ?? defaultSaveData

    try {
      const response = saveDataFn({ ...context, ...baseContext })
      if (response instanceof Promise) return response.catch(catcher)
      return response
    } catch (e) {
      catcher(e)
    }
  }
}
