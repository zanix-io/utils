export type TaskFunction = (...args: never[]) => unknown
export type TaskCallbackResponse = {
  // deno-lint-ignore no-explicit-any
  response: any | null
  error: unknown | null
  messageId?: string
}

/**
 * Represents the callback function type used in the tasker system.
 * The `TaskCallback` is invoked after a task is completed or when an error occurs.
 * It accepts a `TaskerCalbackArgs` object as an argument, which may contain a message or an error.
 */
export type TaskCallback = (response: TaskCallbackResponse) => void

export type TaskMessage = Omit<Parameters<Worker['onmessage']>[0], 'data'> & {
  data: {
    messageId: string
    metaUrl: string
    taskName: string
    parameters: Parameters<TaskFunction>
  }
}
