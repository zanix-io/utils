import type {
  TaskCallback,
  TaskCallbackResponse,
  TaskFunction,
  TaskMessage,
} from 'typings/workers.ts'

/**
 * Manages the execution of tasks in a Web Worker.
 * Allows sending functions to be executed in a separate thread, facilitating asynchronous task handling.
 *
 * This class can be used to offload long-running tasks to a Web Worker, improving performance by freeing up the main thread.
 *
 * @example
 * ```ts
 * // Define a function that uses the WorkerManager to invoke a task.
 * const myFunction = (arg0: string, onFinish: never) => {
 *   // Create a new WorkerManager instance, passing the current module URL and the function itself.
 *   new WorkerManager().task(myFunction, { metaUrl: import.meta.url, onFinish }).invoke(arg0);
 * };
 * ```
 * In this example, the `myFunction` function is invoked with `arg0` as an argument,
 * while the `onFinish` callback will be executed once the task is completed.
 * The task will be executed in a separate Web Worker thread.
 *
 * @category workers
 */
export class WorkerManager {
  private isOpen = false
  #worker!: Worker

  constructor() {
    this.initializeWorker()
  }

  private initializeWorker() {
    // Initialize the worker with the current module's URL
    this.#worker = new Worker(
      new URL(import.meta.url).href,
      { type: 'module' },
    )
    this.isOpen = true
  }

  /**
   * Creates a task and prepares it to be executed in a Web Worker.
   *
   * @param task - The main task function that should be executed in the Web Worker.
   *               This function must be exported from the module provided in `metaUrl`.
   * @param options - Configuration options for the task execution.
   * @param options.metaUrl - The URL of the module containing the task function. Typically, use `import.meta.url` to reference the current module.
   * @param options.onFinish - A callback function that is invoked once the task is completed. It receives the result of the task.
   * @param options.autoClose - Indicates whether the worker should automatically close after the task is finished.
   *                            If `true`, the worker is terminated after completing the task. Defaults to `false`.
   *
   * @returns An object with an `invoke` method to send parameters to the worker for execution.
   *
   * @example
   * const worker = new WorkerManager();
   * worker.task(myTaskFunction, { metaUrl: import.meta.url, onFinish: (result) => { console.log(result); } }).invoke(arg1, arg2);
   */
  public task<T extends TaskFunction>(
    task: T,
    options: { metaUrl: string; onFinish?: TaskCallback; autoClose?: boolean },
  ): { invoke: (...parameters: Parameters<T>) => void } {
    const { onFinish, metaUrl, autoClose = false } = options

    if (!this.isOpen) this.initializeWorker()

    const invoke = (...parameters: Parameters<T>) => {
      // Send a message to the worker to execute the task with the provided parameters
      this.#worker.postMessage({
        taskName: task.name,
        metaUrl,
        parameters,
      })
      // Handle the response from the worker
      this.#worker.onmessage = (e) => {
        e.data._wasWorkerThread = true // Indicate that this message came from a worker
        onFinish?.(e.data) // Call the onFinish callback with the result from the worker

        // Close the worker if autoClose is enabled
        if (autoClose) {
          this.close() // Terminate the worker after finishing the task
        }
      }
      // Handle general errors
      this.#worker.onerror = (e) => {
        onFinish?.({ error: e.error, response: null })
      }
    }

    return {
      /**
       * Sends parameters to the worker for execution.
       *
       * @param parameters - The parameters to pass to the task function inside the worker.
       *
       * @example
       * currentTask.invoke(arg0, arg1);
       */
      invoke,
    }
  }

  /**
   * Terminates the Web Worker, stopping its execution.
   * This should be called when the task is completed to free up resources.
   *
   * @example
   * worker.close();
   */
  public close() {
    // Terminate the worker to stop its execution and allow garbage collection
    this.#worker.terminate()
    this.isOpen = false
  }
}

self.onmessage = async (e: TaskMessage) => {
  try {
    const { metaUrl, taskName, parameters } = e.data
    const module = await import(metaUrl)
    let result = module[taskName](...parameters)
    if (result instanceof Promise) result = await result

    const response: TaskCallbackResponse = { response: result ?? 'OK', error: null }
    self.postMessage?.(response)
  } catch (error) {
    const response: TaskCallbackResponse = { error, response: null }
    self.postMessage?.(response)
  }
}
