export type TaskerFunction = (...args: never[]) => unknown
export type TaskerCalbackArgs = { message?: string; error?: unknown }

/**
 * Represents the callback function type used in the tasker system.
 * The `TaskerCallback` is invoked after a task is completed or when an error occurs.
 * It accepts a `TaskerCalbackArgs` object as an argument, which may contain a message or an error.
 */
export type TaskerCallback = (options: TaskerCalbackArgs) => void

export type TaskerMessage = Omit<Parameters<Worker['onmessage']>[0], 'data'> & {
  data: {
    moduleUrl: string
    taskerName: string
    parameters: Parameters<TaskerFunction>
  }
}
