import type { TaskCallback, TaskFunction, TaskMessage } from 'typings/workers.ts'
import { getWebProcessWorker } from './processor.ts'
import { generateUUID } from 'utils/identifiers.ts'

/**
 * Manages the execution of tasks in a Web Worker.
 * Allows sending functions to be executed in a separate thread, facilitating asynchronous task handling.
 *
 * This class can be used to offload long-running tasks to a Web Worker, improving performance by freeing up the main thread.
 *
 * ⚠️ Note: When used within the same process, it will be treated as an internal worker.
 * This does not create external workers outside of the process in which it is running.
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
  private workers: { worker: Worker; status: 'busy' | 'free' }[] = []
  #tasks: Array<(workerId?: number) => void> = []
  #workerIx: number = 0

  constructor(options: { pool?: number } = {}) {
    const { pool = 1 } = options
    this.#initializeWorkers(pool)
  }

  #instantiateNewWorker() {
    const worker = getWebProcessWorker()
    return worker
  }

  #initializeWorkers(pool: number) {
    // Initialize the worker with the current module's URL
    for (let i = 0; i < pool; i++) {
      const worker = this.#instantiateNewWorker()

      this.workers[i] = worker
    }
  }

  private getWorkerId() {
    let index = this.workers.findIndex((worker) => worker?.status === 'free')
    if (index !== -1) return index

    if (this.#workerIx >= this.workers.length) this.#workerIx = 0
    index = this.#workerIx++ % this.workers.length

    if (this.workers[index]) return index

    const newWorker = this.#instantiateNewWorker()
    this.workers[index] = newWorker

    return index
  }

  private invokeTask(
    taskData: TaskMessage['data'],
    options: { onFinish?: TaskCallback; autoClose?: boolean; timeout: number; verbose?: boolean },
    workerId = this.getWorkerId(),
  ) {
    const { onFinish, autoClose, timeout, verbose = true } = options
    const workerManager = this.workers[workerId]
    const { worker, status } = this.workers[workerId]
    workerManager.status = 'busy'

    if (status === 'busy') {
      return this.#tasks.push((workerId) => {
        this.invokeTask(taskData, options, workerId)
      })
    }

    // Timeout rejection
    const timeoutId = setTimeout(() => {
      const { taskName, metaUrl, messageId } = taskData
      Znx.logger.error(`Worker execution timed out after ${timeout}ms for task "${taskName}"`, {
        meta: { taskName, timeout, module: metaUrl, messageId },
      })
      worker.terminate() // Terminate the worker after finishing the task
      const task = this.#tasks.shift()
      if (task) {
        this.workers[workerId] = this.#instantiateNewWorker()
        task?.(workerId)
      }
    }, timeout)

    // Handle the response from the worker
    worker.onmessage = (e) => {
      clearTimeout(timeoutId)
      const data = e.data
      if (data.error && verbose) {
        Znx.logger.error('An error ocurred in worker execution', data.error)
      }

      if (!data.messageId) return

      data._wasWorkerThread = true // Indicate that this message came from a worker
      data._workerId = workerId // Indicates the worker id

      onFinish?.(data) // Call the onFinish callback with the result from the worker

      workerManager.status = 'free'

      const task = this.#tasks.shift()
      if (task) return task(workerId)

      // Close the worker if autoClose is enabled
      if (autoClose) {
        worker.terminate() // Terminate the worker after finishing the task
        delete this.workers[workerId]
      }
    }

    // Handle general errors
    worker.onerror = (e) => {
      const error = e.error || e
      if (verbose) Znx.logger.error('An error ocurred in worker execution', error)
      onFinish?.({ error, response: null })

      workerManager.status = 'free'

      const task = this.#tasks.shift()
      task?.(workerId)

      return true // Prevents the default error handling
    }

    // Send a message to the worker to execute the task with the provided parameters
    worker.postMessage(taskData)
  }

  /**
   * Creates a task and prepares it for execution inside a Web Worker.
   *
   * This method wraps a function so that it can be executed asynchronously
   * in a dedicated worker thread. The function must be exported from the
   * module specified in `metaUrl`.
   *
   * @template T - The type of the task function.
   *
   * @param task - The main function to execute inside the worker.
   *               Must be exported from the module at `metaUrl`.
   * @param options - Configuration options for the task execution.
   * @param options.metaUrl - The URL of the module containing the task function.
   *                           Typically, use `import.meta.url` for the current module.
   * @param options.onFinish - Optional callback invoked when the task completes.
   *                           Receives the result of the task.
   * @param options.autoClose - If `true`, the worker is automatically terminated
   *                            after the task completes. Defaults to `false`.
   * @param options.timeout - Optional timeout in milliseconds. If the task
   *                           does not complete within this period, the worker
   *                           can be terminated automatically. Defaults to `15000`.
   *
   * @returns An object with an `invoke` method to send parameters to the worker
   *          and execute the task.
   *
   * @example
   * const worker = new WorkerManager();
   * worker.task(myTaskFunction, {
   *   metaUrl: import.meta.url,
   *   onFinish: (result) => console.log(result),
   *   autoClose: true,
   *   timeout: 5000,
   * }).invoke(arg1, arg2);
   */
  public task<T extends TaskFunction>(
    task: T,
    options: { metaUrl: string; onFinish?: TaskCallback; autoClose?: boolean; timeout?: number },
  ): { invoke: (...parameters: Parameters<T>) => void } {
    const { metaUrl, onFinish, autoClose, timeout = 10000 } = options
    const taskName = task.name

    return {
      /**
       * Sends parameters to the worker for execution.
       *
       * @param parameters - The parameters to pass to the task function inside the worker.
       *
       * @example
       * currentTask.invoke(arg0, arg1);
       */
      invoke: (...parameters: Parameters<T>) => {
        this.invokeTask({ taskName, messageId: generateUUID(), parameters, metaUrl }, {
          onFinish,
          autoClose,
          timeout,
        })
      },
    }
  }

  /**
   * Terminates all active Web Workers, stopping their execution and freeing up resources.
   * This method should be called when the task is complete to ensure proper cleanup and
   * to avoid memory leaks. It iterates over the list of workers, terminates each one,
   * and deletes the corresponding references from the internal list.
   *
   * @example
   * // Assuming `workerManager` is an instance of a class managing Web Workers
   * workerManager.close(); // Terminates all active workers and cleans up resources
   *
   * @returns {void}
   *   This method doesn't return any value.
   */
  public close(): void {
    // Terminate the worker to stop its execution and allow garbage collection
    for (let i = 0; i < this.workers.length; i++) {
      this.workers[i].worker.terminate() // Terminate the worker to stop execution
      delete this.workers[i] // Clean up the reference from the workers array
    }
  }
}
