import type { TaskCallbackResponse, TaskMessage } from 'typings/workers.ts'
import { generateUUID } from 'utils/identifiers.ts'

export const getWebProcessWorker = (): { worker: Worker; status: 'busy' | 'free' } => {
  const worker = new Worker(import.meta.url, { type: 'module' })
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
  event.preventDefault?.()
  sendError(event.error || event)
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

    const module = await import(metaUrl)

    let result = module[taskName](...parameters)

    if (result instanceof Promise) result = await result

    const response: TaskCallbackResponse = { response: result ?? 'OK', error: null, messageId }
    self.postMessage?.(response)
  } catch (error) {
    const response: TaskCallbackResponse = { error, response: null, messageId }
    self.postMessage?.(response)
  }
}
