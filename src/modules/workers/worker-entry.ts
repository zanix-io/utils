// Real relative paths, not this package's own `typings/`/`utils/` import-map aliases — this file
// is the entry Vite's `worker-import-meta-url` plugin bundles as a SEPARATE, nested Rolldown build
// (see `getWebProcessWorker`, `./processor.ts`'s own doc, for the real `new Worker(new URL(...))`
// call a `@zanix/space` client bundle reaches via `@zanix/logger`). That nested build inherits the
// host build's full `plugins` array unless the host explicitly scopes `build.worker.plugins`
// narrower — and confirmed empirically, `deno()` (needed to resolve the aliases above) resolves
// itself pathologically in that nested context, hanging the whole build. Real relative imports
// need no Deno-aware resolution at all, so this file works whether or not `deno()` is present in
// whatever `worker.plugins` array the host build configures — see `@zanix/space`'s own
// `build-client.ts` for the host build's own `worker.plugins` scoping.
import type { TaskCallbackResponse, TaskMessage } from '../../typings/workers.ts'
import { generateUUID } from '../../utils/identifiers.ts'

// deno-lint-ignore no-explicit-any
const moduleCache = new Map<string, any>()

/**
 * This module's own top-level code (`self.onerror`, the `unhandledrejection` listener, and
 * `self.onmessage` below) only runs inside the dedicated Worker realm `getWebProcessWorker`
 * (`./processor.ts`) spawns — never in the host process. Keeping it in a file the host never
 * statically imports is deliberate: a `Worker`'s entry module is always evaluated top-level, so
 * merging this back into a module the host imports for its exports would install these same
 * global handlers in the HOST process too, silently swallowing every one of its own unhandled
 * promise rejections process-wide.
 */

const sendError = (error: Error) => {
  const baseError = {
    id: generateUUID(),
    message: `Worker unhandled rejection: ${error?.message || error.toString() || 'Unknown'}`,
    cause: error,
    code: 'UNHANDLED_PROMISE_REJECTION',
    timestamp: new Date().toISOString(),
  }

  const response: TaskCallbackResponse = { error: baseError, response: null }
  self.postMessage?.(response)
}

self.onerror = (event) => {
  // `self.onerror`'s ambient type is shared with `window.onerror` (`Event | string`) — inside a
  // dedicated worker's own global scope it always receives a real `ErrorEvent`, but narrowed
  // explicitly here rather than cast, so a genuinely unexpected shape degrades gracefully instead
  // of crashing on a property access TypeScript can't otherwise verify.
  if (typeof event === 'string') {
    sendError(new Error(event))
    return true
  }
  event.preventDefault?.()
  sendError('error' in event ? event.error : event)
  return true // Prevents the default error handling
}

self.addEventListener('unhandledrejection', async (event) => {
  event.preventDefault()
  await event.promise.catch((err) => {
    sendError(err)
  })
})

self.onmessage = async (e: TaskMessage) => {
  const messageId = e.data?.messageId
  try {
    const { metaUrl, taskName, parameters } = e.data

    let module = moduleCache.get(metaUrl)

    if (!module) {
      module = await import(metaUrl)
      moduleCache.set(metaUrl, module)
    }

    let result = module[taskName](...parameters)

    if (result instanceof Promise) result = await result

    const response: TaskCallbackResponse = {
      response: result ?? 'OK',
      error: null,
      messageId,
    }
    self.postMessage?.(response)
  } catch (error) {
    const response: TaskCallbackResponse = { error, response: null, messageId }
    self.postMessage?.(response)
  }
}
