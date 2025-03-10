export type TaskerFunction = (...args: never[]) => unknown
export type TaskerCalbackArgs = { message?: string; error?: unknown }
export type TaskerCallback = (options: TaskerCalbackArgs) => void
export type TaskerMessage = Omit<Parameters<Worker['onmessage']>[0], 'data'> & {
  data: {
    moduleUrl: string
    taskerName: string
    parameters: Parameters<TaskerFunction>
  }
}
