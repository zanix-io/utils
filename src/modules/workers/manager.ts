import type {
  TaskCallback,
  TaskFunction,
  TaskMessage,
  WorkerEntry,
  WorkerFactory,
} from 'typings/workers.ts'
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
  /** The pool of workers managed by this instance, indexed by worker id. */
  private workers: WorkerEntry[] = []
  /** Tasks queued while every worker in the pool is busy. */
  #tasks: Array<(workerId?: number) => void> = []
  /** Round-robin cursor used by {@link getWorkerId} when no worker is free. */
  #workerIx: number = 0

  #permissions?: Deno.PermissionOptions

  /**
   * Creates a new `WorkerManager`, initializing the internal pool of workers.
   *
   * @param options.pool - The number of workers to keep in the pool. Defaults to `1`.
   * @param options.permissions - Restricts every worker THIS pool creates (see
   * `getWebProcessWorker`'s own doc) — real sandboxing for a task that must never touch `net`/
   * `read`/`write`/`env`/`run`/`ffi`/`sys` beyond an explicit allow-list, independent of the host
   * process's own full permission set. Omit entirely (the default) for unchanged, unrestricted
   * behavior — every existing caller of this class keeps working exactly as before. A pool
   * mixing tasks that need DIFFERENT permission profiles should use a SEPARATE `WorkerManager`
   * instance per profile, never one shared pool — permissions are set once, at pool creation, for
   * every worker this instance will ever create (including ones instantiated later to replace a
   * timed-out worker, see `getWorkerId`).
   * @param createWorker - Optional factory used to create worker instances.
   * Useful for testing or providing a custom worker implementation.
   */
  constructor(
    options: { pool?: number; permissions?: Deno.PermissionOptions } = {},
    private readonly createWorker: WorkerFactory = getWebProcessWorker,
  ) {
    const { pool = 1, permissions } = options
    this.#permissions = permissions
    this.#initializeWorkers(pool)
  }

  #instantiateNewWorker() {
    const worker = this.createWorker(this.#permissions)
    return worker
  }

  #initializeWorkers(pool: number) {
    // Initialize the worker with the current module's URL
    for (let i = 0; i < pool; i++) {
      const worker = this.#instantiateNewWorker()

      this.workers[i] = worker
    }
  }

  /**
   * Resolves the index of a worker to use for the next task: prefers a free
   * worker, otherwise round-robins over the pool, instantiating a new worker
   * if the resolved slot is empty.
   */
  private getWorkerId(): number {
    let index = this.workers.findIndex((worker) => worker?.status === 'free')
    if (index !== -1) return index

    if (this.#workerIx >= this.workers.length) this.#workerIx = 0
    index = this.#workerIx++ % this.workers.length

    if (this.workers[index]) return index

    const newWorker = this.#instantiateNewWorker()
    this.workers[index] = newWorker

    return index
  }

  /**
   * Sends a task to the given (or resolved) worker, queueing it instead if
   * that worker is currently busy, and wires up the timeout, message and
   * error handlers that settle the task once the worker responds.
   */
  private invokeTask(
    taskData: TaskMessage['data'],
    options: {
      onFinish?: TaskCallback
      autoClose?: boolean
      timeout: number
      verbose?: boolean
    },
    workerId = this.getWorkerId(),
  ): void {
    const { onFinish, autoClose, timeout, verbose = true } = options
    const workerManager = this.workers[workerId]
    const { worker, status } = this.workers[workerId]
    workerManager.status = 'busy'

    if (status === 'busy') {
      this.#tasks.push((workerId) => {
        this.invokeTask(taskData, options, workerId)
      })
      return
    }

    // Timeout rejection
    const timeoutId = setTimeout(() => {
      const { taskName, metaUrl, messageId } = taskData
      Znx.logger.error(
        `Worker execution timed out after ${timeout}ms for task "${taskName}"`,
        {
          meta: { taskName, timeout, module: metaUrl, messageId },
        },
      )
      worker.terminate() // Terminate the worker after finishing the task
      // A terminated worker can never post its own response back — without this, `onFinish` (and
      // anything awaiting it, e.g. a caller wrapping `.invoke()` in a Promise) would simply hang
      // forever on a timeout instead of ever settling. `worker.onmessage`/`.onerror` are never
      // called for a terminated worker, so this is the only place that can report it.
      onFinish?.({
        error: new Error(
          `Worker execution timed out after ${timeout}ms for task "${taskName}"`,
        ),
        response: null,
        messageId,
      })
      // Always replace this slot with a genuinely fresh, working worker — not only when a queued
      // task happens to be waiting. Otherwise the terminated `worker` object stays parked here,
      // still reporting whatever stale `status` it had, and could later be handed a NEW task by
      // `getWorkerId`'s own round-robin — which would then hang forever too, since a terminated
      // worker can never respond to anything.
      this.workers[workerId] = this.#instantiateNewWorker()
      const task = this.#tasks.shift()
      if (task) task(workerId)
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
      if (verbose) {
        Znx.logger.error('An error ocurred in worker execution', error)
      }
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
   *                           can be terminated automatically. Defaults to `10000`.
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
    options: {
      metaUrl: string
      onFinish?: TaskCallback
      autoClose?: boolean
      timeout?: number
      verbose?: boolean
    },
  ): { invoke: (...parameters: Parameters<T>) => void } {
    const { metaUrl, verbose, onFinish, autoClose, timeout = 10000 } = options
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
        this.invokeTask({
          taskName,
          messageId: generateUUID(),
          parameters,
          metaUrl,
        }, {
          onFinish,
          autoClose,
          verbose,
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
