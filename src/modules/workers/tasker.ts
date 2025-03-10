import type { TaskerCallback, TaskerFunction, TaskerMessage } from 'typings/workers.ts'

/**
 * This class manages the execution of tasks in a Web Worker.
 * It allows sending functions to be executed in a separate thread, facilitating asynchronous task handling.
 *
 * @example
 * ```ts
 * // Define a function that uses the TaskerManager to invoke a task.
 * const myFunction = (arg0: string, callback: never) => {
 *   // Create a new TaskerManager instance, passing the current module URL and the function itself
 *   new TaskerManager(import.meta.url, myFunction, callback).invoke(arg0);
 * };
 * ```
 * This example demonstrates how to create a function (`myFunction`) that utilizes
 * the `TaskerManager` class to invoke a task using the current module's URL and
 * the function itself as parameters. The function is then invoked with `arg0`.
 */
export class TaskerManager<T extends TaskerFunction> {
  #worker
  /**
   * @param moduleUrl - The URL of the module containing the task function. Typically, use `import.meta.url` to reference the current module.
   * @param tasker - The main task function exported from the module, which will be executed in the worker.
   *                 Ensure that this function is exported from the module.
   * @param callback - A callback function that is executed once the task is completed, receiving the task's result.
   */
  constructor(private moduleUrl: string, private tasker: T, private callback?: TaskerCallback) {
    this.#worker = new Worker(
      new URL(import.meta.url).href,
      {
        type: 'module',
      },
    )
  }
  /**
   * Sends the function and its parameters to the worker for execution.
   *
   * @param parameters - The parameters passed to the function that will be executed in the worker.
   */
  public invoke(...parameters: Parameters<T>) {
    // Send a message to the worker with the function and its parameters
    this.#worker.postMessage({
      moduleUrl: this.moduleUrl,
      taskerName: this.tasker.name,
      parameters,
    })
    // Receive confirmation message
    this.#worker.onmessage = (e) => {
      e.data._wasWorkerThread = true
      this.callback?.(e.data)
    }
  }
}

self.onmessage = async (e: TaskerMessage) => {
  try {
    const { moduleUrl, taskerName, parameters } = e.data
    const module = await import(moduleUrl)
    let result = module[taskerName](...parameters)
    if (result instanceof Promise) result = await result

    self.postMessage?.({ ...result })
  } catch (error) {
    self.postMessage?.({ error })
  }
  self.close()
}
