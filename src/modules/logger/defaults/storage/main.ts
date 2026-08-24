import type {
  BaseFormattedLog,
  DefaultFormattedLog,
  DefaultResponse,
  SaveDataFunction,
} from 'typings/logger.ts'

import { showMessage } from 'modules/logger/base.ts'
import { serializeError } from 'modules/errors/serialize.ts'
import { createRedactor } from 'modules/errors/redact.ts'

// `saveDataFileFunction` (file-based storage, `WorkerManager`-backed) deliberately does NOT live
// in this file — see `./default.ts`'s own doc for why. This file (and `baseSaveData`/
// `saveDataGeneralFunction` below) must stay reachable from a browser client bundle
// (`main.ts`'s own `createClientLogger`) without ever touching `Deno.readTextFile`/`WorkerManager`,
// even indirectly, even behind a dynamic `import()` — confirmed empirically that a dynamic import
// present ANYWHERE in this file's own source, even inside a function nothing calls, still makes
// Vite's `worker-import-meta-url` plugin try (and, for a JSR-hosted `processor.ts`, fail) to
// resolve it, regardless of reachability.

/**
 * Builds a `SaveDataFunction` that hands each log's already-formatted entry straight to
 * `fetcher` — never `JSON.stringify`'d here, so the caller decides whether/how to serialize it
 * (e.g. as a `fetch()` request body). The browser-safe counterpart to
 * `defaults/storage/default.ts`'s own file-based `saveDataFileFunction`.
 * @param fetcher - Receives one already-formatted log entry per call — typically sent to this
 * app's own backend endpoint (e.g. `@zanix/space`'s `/api/log`), which relays it into the
 * server's own `Logger` via `Logger#ingest`.
 */
export function saveDataGeneralFunction(
  fetcher: <T extends BaseFormattedLog = DefaultFormattedLog>(fmtLog: T) => void | Promise<void>,
): SaveDataFunction<DefaultResponse> {
  return (context) => {
    return Promise.resolve(fetcher(context.getFmtLog()))
  }
}

/**
 * Wraps any already-resolved `SaveDataFunction` with the shared try/catch-and-report contract
 * every `Logger` storage strategy follows — file-based, custom, Elasticsearch, whatever
 * `saveDataFunction` turns out to be.
 * @param saveDataFunction - The already-resolved save function — `main.ts`'s own `Logger`
 * constructor is what decides which concrete function this ends up being (an explicit custom
 * one, or `fileSaveFactory`'s file-based default), never this function itself.
 * @param explicitSave - Whether the caller (`Logger`'s constructor) gave `storage.save`
 * explicitly at all — a real function OR a `SaveDataFile` config object, either counts — as
 * opposed to omitting it entirely and relying on the fully-automatic file default. See the
 * `isInternal` check below for why this still needs to travel as its own flag, now that
 * `saveDataFunction` above is already fully resolved either way.
 */
export function baseSaveData(
  saveDataFunction: SaveDataFunction,
  explicitSave: boolean,
  redact: ReturnType<typeof createRedactor> = createRedactor(),
): SaveDataFunction {
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
    // `Zanix.start()`/`.serve()`), so it shouldn't assume a log file destination either. An
    // EXPLICIT `storage.save` (a real function, or a `SaveDataFile` config object) always wins
    // over this guard regardless of project type — the caller made a deliberate choice.
    //
    // Checked here, at the first real save — not at `baseSaveData`'s own call time (i.e.
    // `Logger`'s constructor) — because `Znx.config` resolves lazily (see `setGlobalZnx`);
    // reading it here instead of eagerly is what keeps merely constructing a `Logger` (`Logger`'s
    // own module creates one on import) from forcing a synchronous config read off disk.
    const isInternal = Znx.config.project === 'app' || Znx.config.project === 'library'

    if (isInternal && !explicitSave) return

    try {
      const response = saveDataFunction(context)
      if (response instanceof Promise) return response.catch(catcher)
      return response
    } catch (e) {
      catcher(e)
    }
  }
}
