import type { TaskCallbackResponse, TaskMessage, WorkerEntry } from 'typings/workers.ts'
import { generateUUID } from 'utils/identifiers.ts'

// deno-lint-ignore no-explicit-any
const moduleCache = new Map<string, any>()

/**
 * Spawns the real worker every `WorkerManager` instance's pool is built from.
 *
 * @param permissions Forwarded as-is to `Worker`'s own `deno.permissions` option — restricts what
 * this ONE worker can do (`net`/`read`/`write`/`env`/`run`/`ffi`/`sys`), independent of every other
 * worker in the same or a different pool. Omit entirely (the default, unchanged behavior for every
 * existing caller) to inherit the host process's own full permission set, exactly as before this
 * parameter existed. A worker's permissions can never exceed its parent's own — Deno's own Worker
 * API enforces that, not this function.
 */
export const getWebProcessWorker = (
  permissions?: Deno.PermissionOptions,
): WorkerEntry => {
  const worker = new Worker(import.meta.url, {
    type: 'module',
    ...(permissions !== undefined ? { deno: { permissions } } : {}),
  })
  return { worker, status: 'free' }
}

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
