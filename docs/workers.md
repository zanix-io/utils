# Workers

The `/workers` subpath ships a `WorkerManager` class for running functions in a
separate Web Worker thread instead of blocking the main thread. It is useful for
offloading long-running or CPU-intensive work — heavy computations,
resource-intensive log storage, and similar tasks — while keeping the rest of
your application responsive. Internally, `Logger`'s `useWorker` storage option
is itself built on top of `WorkerManager`.

```ts
import { WorkerManager } from 'jsr:@zanix/utils@[version]/workers'
```

Note that, when used within the same process, `WorkerManager` is treated as an
internal worker: it does not create workers outside of the process in which it
runs.

## Quick usage

Create a `WorkerManager`, register a task with `.task(fn, options)`, and call
`.invoke(...args)` to run it. The function passed to `task` must be **exported**
from the module referenced by `metaUrl` — typically `import.meta.url` of the
file where the function lives — because the worker imports that module
dynamically and looks up the function by name:

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

Asynchronous task functions work the same way — if the function returns a
`Promise`, `WorkerManager` awaits it inside the worker before posting the result
back:

```ts
export function asyncMultiply(a: number, b: number) {
  return new Promise<number>((resolve) => setTimeout(() => resolve(a * b), 500))
}

wm.task(asyncMultiply, { metaUrl: import.meta.url, onFinish: console.log })
  .invoke(4, 5)
```

The result delivered to `onFinish` always has the shape
`{ response, error, messageId }`, plus `_wasWorkerThread: true` and `_workerId`
added once the message comes back from the worker.

If `autoClose` is not set (it defaults to `false`), the worker stays alive and
ready to accept another `.task(...).invoke(...)` call, which is more efficient
when you plan to send several tasks to it over time. Call `.close()` to
terminate every worker in the manager's pool when you're done with it:

```ts
wm.close()
```

## Worker pool

By default a `WorkerManager` keeps a pool of a single worker. Pass `{ pool: n }`
to keep several workers ready, letting multiple tasks run concurrently instead
of queueing on one worker:

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

`WorkerManager` picks a free worker from the pool when one is available;
otherwise it round-robins across the pool, queueing new tasks against whichever
worker becomes free next (or spinning up a fresh worker if none exists at that
slot yet). Calling `.invoke(...)` multiple times on the same task also queues
additional invocations the same way.

## Error handling and timeout

If the task function throws synchronously, rejects a returned `Promise`, or the
worker itself errors out (including an uncaught error or unhandled rejection
inside the worker), `onFinish` still gets called — this time with `error`
populated and `response: null`:

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

By default (`verbose: true` internally), worker errors are also logged
automatically through `Znx.logger.error`. After an error, the worker that failed
is freed up again (or, in the timeout case, a fresh worker is spun up) so
subsequent tasks keep working normally.

`options.timeout` controls how long, in milliseconds, `WorkerManager` waits for
a task to finish before giving up on it; it defaults to `10000` (10 seconds).
When the timeout elapses, the pending worker is terminated, the failure is
logged, and a new worker takes its place to run any queued task:

```ts
wm.task(loopError, {
  metaUrl: import.meta.url,
  autoClose: true,
  timeout: 1000, // give up after 1 second instead of the default 10000
}).invoke()
```

## Restricting a worker's permissions (real sandboxing)

Pass `{ permissions }` to restrict what EVERY worker a given `WorkerManager`
instance creates may do — network, filesystem, environment variables,
subprocesses, FFI, and system info, independent of the host process's own
(broader) permission set. This is forwarded as-is to `Worker`'s own
`deno.permissions` option, so the exact same allow-list shapes Deno's own
`--allow-*` CLI flags accept apply here too (`true`/`false`/`'inherit'`, or an
array of allowed values for `read`/`write`/ `net`/`run`/`ffi`).

**Requires Deno's still-unstable `worker-options` feature.** Add
`"unstable": ["worker-options"]` to `deno.jsonc`/`deno.json` (this package's own
config already does), or pass `--unstable-worker-options` on the CLI — without
it, creating the pool throws as soon as it tries to build its first worker.

**The task's own module needs `read` (or `net`, for a remote `metaUrl`) no
matter what the task itself does.** An object `permissions` value replaces the
_entire_ permission set — it does not mean "restrict only what's listed, inherit
the rest." Any category left out defaults to fully denied. Since every task is
loaded via a dynamic `import(metaUrl)` inside the worker, at minimum the task
module's own path (and anything it imports) must be allowed under `read`/`net`,
or the task fails before it ever runs, with a permission error — not a hang:

```ts
import { WorkerManager } from 'jsr:@zanix/utils@[version]/workers'

// This pool's workers can import their own task module (a local file) and reach ONLY
// api.example.com over the network — no writes, no env vars, no subprocesses.
const sandboxed = new WorkerManager({
  pool: 1,
  permissions: {
    read: [new URL('./fetch-task.ts', import.meta.url).pathname],
    net: ['api.example.com'],
    write: false,
    env: false,
    run: false,
  },
})

sandboxed.task(fetchTask, { metaUrl: import.meta.url, onFinish: console.log })
  .invoke()
```

A worker's permissions can never exceed its parent's own — Deno's own `Worker`
API enforces that, not `WorkerManager`. Omit `permissions` entirely (the
default) to keep inheriting the host process's full permission set, exactly as
before this option existed — every existing caller keeps working unchanged.

**Honest limitation**: this restricts ACCESS — it is not a CPU-time or memory
quota. Deno's `Worker` API has no such governance option today;
`options.timeout` (above) — terminating a worker that runs too long — is the
only available protection against a runaway/CPU-bound task, and there is
currently no way to cap a worker's memory usage from plain TypeScript/JavaScript
without a custom Rust-embedded Deno build.

## Custom worker creation

The `WorkerManager` constructor takes an optional second argument,
`createWorker`, a factory used instead of the default `getWebProcessWorker`
whenever the pool needs a new worker. It's mainly useful for tests that need to
simulate worker behavior (e.g. forcing an error) without spinning up a real Web
Worker:

```ts
const wm = new WorkerManager({}, () => ({
  worker: fakeWorker, // must match the shape `getWebProcessWorker` returns
  status: 'free',
}))
```

## See also

- [Errors](./errors.md)
- [Types reference](./types.md) — `TaskFunction`, `TaskCallback`,
  `TaskCallbackResponse`
