# Workers

The `/workers` subpath ships a `WorkerManager` class for running functions in a separate Web Worker thread instead of blocking the main thread. It is useful for offloading long-running or CPU-intensive work — heavy computations, resource-intensive log storage, and similar tasks — while keeping the rest of your application responsive. Internally, `Logger`'s `useWorker` storage option is itself built on top of `WorkerManager`.

```ts
import { WorkerManager } from 'jsr:@zanix/utils@[version]/workers'
```

Note that, when used within the same process, `WorkerManager` is treated as an internal worker: it does not create workers outside of the process in which it runs.

## Quick usage

Create a `WorkerManager`, register a task with `.task(fn, options)`, and call `.invoke(...args)` to run it. The function passed to `task` must be **exported** from the module referenced by `metaUrl` — typically `import.meta.url` of the file where the function lives — because the worker imports that module dynamically and looks up the function by name:

```ts
import { WorkerManager } from 'jsr:@zanix/utils@[version]/workers'

// `add` must be an exported function in this same module
export function add(a: number, b: number) {
  return a + b
}

const wm = new WorkerManager()

wm.task(add, {
  metaUrl: import.meta.url,
  onFinish: (result) => console.log(result), // { response: 5, error: null, ... }
  autoClose: true, // terminate the worker once this task finishes
}).invoke(2, 3)
```

Asynchronous task functions work the same way — if the function returns a `Promise`, `WorkerManager` awaits it inside the worker before posting the result back:

```ts
export function asyncMultiply(a: number, b: number) {
  return new Promise<number>((resolve) => setTimeout(() => resolve(a * b), 500))
}

wm.task(asyncMultiply, { metaUrl: import.meta.url, onFinish: console.log }).invoke(4, 5)
```

The result delivered to `onFinish` always has the shape `{ response, error, messageId }`, plus `_wasWorkerThread: true` and `_workerId` added once the message comes back from the worker.

If `autoClose` is not set (it defaults to `false`), the worker stays alive and ready to accept another `.task(...).invoke(...)` call, which is more efficient when you plan to send several tasks to it over time. Call `.close()` to terminate every worker in the manager's pool when you're done with it:

```ts
wm.close()
```

## Worker pool

By default a `WorkerManager` keeps a pool of a single worker. Pass `{ pool: n }` to keep several workers ready, letting multiple tasks run concurrently instead of queueing on one worker:

```ts
import { WorkerManager } from 'jsr:@zanix/utils@[version]/workers'

const wm = new WorkerManager({ pool: 3 })

wm.task(asyncMultiply, {
  metaUrl: import.meta.url,
  onFinish: (result) => console.log('task 1', result),
  autoClose: true,
}).invoke(1, 2)

wm.task(add, {
  metaUrl: import.meta.url,
  onFinish: (result) => console.log('task 2', result),
  autoClose: true,
}).invoke(1, 2)

wm.task(asyncMultiply, {
  metaUrl: import.meta.url,
  onFinish: (result) => console.log('task 3', result),
  autoClose: true,
}).invoke(2, 3)
```

`WorkerManager` picks a free worker from the pool when one is available; otherwise it round-robins across the pool, queueing new tasks against whichever worker becomes free next (or spinning up a fresh worker if none exists at that slot yet). Calling `.invoke(...)` multiple times on the same task also queues additional invocations the same way.

## Error handling and timeout

If the task function throws synchronously, rejects a returned `Promise`, or the worker itself errors out (including an uncaught error or unhandled rejection inside the worker), `onFinish` still gets called — this time with `error` populated and `response: null`:

```ts
export function inmetiateError() {
  throw new Error('Error')
}

wm.task(inmetiateError, {
  metaUrl: import.meta.url,
  onFinish: ({ error, response }) => {
    console.log(error.message) // "Error"
    console.log(response) // null
  },
}).invoke()
```

By default (`verbose: true` internally), worker errors are also logged automatically through `Znx.logger.error`. After an error, the worker that failed is freed up again (or, in the timeout case, a fresh worker is spun up) so subsequent tasks keep working normally.

`options.timeout` controls how long, in milliseconds, `WorkerManager` waits for a task to finish before giving up on it; it defaults to `10000` (10 seconds). When the timeout elapses, the pending worker is terminated, the failure is logged, and a new worker takes its place to run any queued task:

```ts
wm.task(loopError, {
  metaUrl: import.meta.url,
  autoClose: true,
  timeout: 1000, // give up after 1 second instead of the default 10000
}).invoke()
```

## See also

- [Errors](./errors.md)
- [Types reference](./types.md) — `TaskFunction`, `TaskCallback`, `TaskCallbackResponse`
