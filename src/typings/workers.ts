export type TaskerFunction = (...args: never[]) => unknown
export type TaskerCallback = (options: { message?: string; error?: unknown }) => void
export type TaskerMessage = Omit<Parameters<Worker['onmessage']>[0], 'data'> & {
  data: {
    moduleUrl: string
    taskerName: string
    parameters: Parameters<TaskerFunction>
  }
}
