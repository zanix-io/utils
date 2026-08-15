// deno-lint-ignore-file no-explicit-any
import { WorkerManager } from 'modules/workers/manager.ts'
import { assert, assertArrayIncludes, assertEquals } from '@std/assert'
import {
  add,
  asyncMultiply,
  healthy,
  inmetiateError,
  loopError,
  readEnv,
  recurseError,
  timeoutError,
} from './tasks.ts'
import 'modules/logger/mod.ts' // initialize logger
import { assertSpyCalls, spy, stub } from '@std/testing/mock'

console.error = () => {}

const checkHealthy = async (wm: WorkerManager) => {
  // Check worker healthy
  const { response }: any = await new Promise((resolve) => {
    const task = wm.task(healthy, {
      metaUrl: new URL('./tasks.ts', import.meta.url).href,
      onFinish: resolve,
      autoClose: true,
    })
    task.invoke()
  })

  assert(response)
}

Deno.test('execute synchronous task in worker', async () => {
  const wm = new WorkerManager()
  const result: any = await new Promise((resolve) => {
    const invoker = wm.task(add, {
      metaUrl: new URL('./tasks.ts', import.meta.url).href,
      onFinish: resolve,
    })
    invoker.invoke(2, 3)
  })

  delete result.messageId
  assertEquals(result, {
    error: null,
    response: 5,
    _wasWorkerThread: true,
    _workerId: 0,
  })

  // trying to execute another task on worker open
  const resultClosed: any = await new Promise((resolve) => {
    const task = wm.task(add, {
      metaUrl: new URL('./tasks.ts', import.meta.url).href,
      onFinish: resolve,
    })
    task.invoke(4, 5)
  })

  delete resultClosed.messageId
  assertEquals(resultClosed, {
    error: null,
    response: 9,
    _wasWorkerThread: true,
    _workerId: 0,
  })
})

Deno.test('execute asynchronous task in worker', async () => {
  const wm = new WorkerManager()

  const result: any = await new Promise((resolve) => {
    const task = wm.task(asyncMultiply, {
      metaUrl: new URL('./tasks.ts', import.meta.url).href,
      onFinish: resolve,
      autoClose: true,
    })
    task.invoke(4, 5)
  })

  delete result.messageId
  assertEquals(result, {
    error: null,
    response: 20,
    _wasWorkerThread: true,
    _workerId: 0,
  })

  // trying to execute another task after closed, it generates a new worker

  const resultClosed: any = await new Promise((resolve) => {
    const task = wm.task(asyncMultiply, {
      metaUrl: new URL('./tasks.ts', import.meta.url).href,
      onFinish: resolve,
    })
    task.invoke(3, 5)
  })

  delete resultClosed.messageId
  assertEquals(resultClosed, {
    error: null,
    response: 15,
    _wasWorkerThread: true,
    _workerId: 0,
  })
})

Deno.test('WorkerManager: execute multiple tasks', async () => {
  const wm = new WorkerManager({ pool: 3 })

  const responses: unknown[] = []

  let task = wm.task(asyncMultiply, {
    metaUrl: new URL('./tasks.ts', import.meta.url).href,
    onFinish: ({ response }) => {
      responses.push({ 1: response })
    },
    autoClose: true,
  })
  task.invoke(1, 2)

  const taskerror = wm.task(timeoutError, {
    metaUrl: new URL('./tasks.ts', import.meta.url).href,
    onFinish: ({ response }) => {
      responses.push({ 2: response })
    },
    autoClose: true,
  })
  taskerror.invoke()

  task = wm.task(add, {
    metaUrl: new URL('./tasks.ts', import.meta.url).href,
    onFinish: ({ response }) => {
      responses.push({ 3: response })
    },
    autoClose: true,
  })
  task.invoke(1, 2)

  task = wm.task(asyncMultiply, {
    metaUrl: new URL('./tasks.ts', import.meta.url).href,
    onFinish: ({ response }) => {
      responses.push({ 4: response })
    },
    autoClose: true,
  })
  task.invoke(2, 3)
  task.invoke(3, 3)
  task.invoke(3, 4)

  let interval
  await new Promise((resolve) => {
    interval = setInterval(() => {
      if (responses.length === 6) resolve(true)
    }, 100)
  })

  assertArrayIncludes(
    [{ '2': 'OK' }, { '3': 3 }, { '1': 2 }, { '4': 6 }, { '4': 9 }, {
      '4': 12,
    }],
    responses,
  )

  assert(!wm['workers'].filter(Boolean).length) // closed
  clearInterval(interval)
})

Deno.test('Recursive worker error', async () => {
  const wm = new WorkerManager()

  const resultError: any = await new Promise((resolve) => {
    const task = wm.task(recurseError, {
      metaUrl: new URL('./tasks.ts', import.meta.url).href,
      onFinish: resolve,
    })
    task.invoke()
  })

  assertEquals(resultError.error.message, 'Maximum call stack size exceeded')

  // Check worker healthy
  await checkHealthy(wm)
})

Deno.test('Async worker error', async () => {
  const wm = new WorkerManager()

  await new Promise((resolve) => {
    const task = wm.task(timeoutError, {
      metaUrl: new URL('./tasks.ts', import.meta.url).href,
      onFinish: resolve,
    })
    task.invoke()
  })

  // wait until error
  await new Promise((resolve) => setTimeout(resolve, 150))

  // Check worker healthy
  await checkHealthy(wm)
})

Deno.test('Disable verbose on worker manager', async () => {
  const wm = new WorkerManager()

  const errorStub = stub(console, 'error')
  const resultError: any = await new Promise((resolve) => {
    const task = wm.task(inmetiateError, {
      verbose: false,
      metaUrl: new URL('./tasks.ts', import.meta.url).href,
      onFinish: resolve,
    })
    task.invoke()
  })

  assertSpyCalls(errorStub, 0)

  errorStub.restore()
  assertEquals(resultError.error.message, 'Error')

  // Check worker healthy
  await checkHealthy(wm)
})

Deno.test('Inmmediate worker error', async () => {
  const wm = new WorkerManager()

  const errorStub = stub(console, 'error')
  const resultError: any = await new Promise((resolve) => {
    const task = wm.task(inmetiateError, {
      metaUrl: new URL('./tasks.ts', import.meta.url).href,
      onFinish: resolve,
    })
    task.invoke()
  })

  assertSpyCalls(errorStub, 1)

  errorStub.restore()
  assertEquals(resultError.error.message, 'Error')

  // Check worker healthy
  await checkHealthy(wm)
})

Deno.test('Promise rejection error', async () => {
  const wm = new WorkerManager()

  const resultError: any = await new Promise((resolve) => {
    const task = wm.task(inmetiateError, {
      metaUrl: new URL('./tasks.ts', import.meta.url).href,
      onFinish: resolve,
    })
    task.invoke()
  })

  assertEquals(resultError.error.message, 'Error')

  // Check worker healthy
  await checkHealthy(wm)
})

Deno.test('Worker: Loop error', async () => {
  const wm = new WorkerManager()

  const task = wm.task(loopError, {
    metaUrl: new URL('./tasks.ts', import.meta.url).href,
    autoClose: true,
    timeout: 1000,
  })
  task.invoke()

  // Check worker healthy
  await checkHealthy(wm)

  assert(!wm['workers'].filter(Boolean).length) // closed
})

Deno.test(
  'Worker: a timeout with no queued task calls onFinish and recovers the pool',
  async () => {
    const wm = new WorkerManager()

    // Unlike "Worker: Loop error" above, nothing is queued while the timeout is pending — this
    // is the exact gap the timeout handler's own fix closes: `onFinish` must still be called (it
    // never was before), and the dead worker slot must still be replaced with a fresh one even
    // when no queued task is there to trigger the replacement.
    const result: any = await new Promise((resolve) => {
      const task = wm.task(loopError, {
        metaUrl: new URL('./tasks.ts', import.meta.url).href,
        onFinish: resolve,
        timeout: 300,
      })
      task.invoke()
    })

    assertEquals(result.response, null)
    assertEquals(
      result.error.message,
      'Worker execution timed out after 300ms for task "loopError"',
    )

    // The pool must have already been repaired — a fresh, working worker in this slot — without
    // depending on any queued task to have triggered the replacement.
    await checkHealthy(wm)
  },
)

Deno.test('WorkerManager handles worker.onerror', async () => {
  let onmessage: ((e: any) => void) | undefined
  let onerror: ((e: any) => boolean | void) | undefined

  const terminate = () => {}
  const loggerSpy = spy(Znx.logger, 'error')

  const fakeWorker = {
    postMessage() {
      onerror?.({
        error: new Error('boom'),
      })
    },
    terminate,
    set onmessage(cb) {
      onmessage = cb
    },
    get onmessage() {
      return onmessage
    },
    set onerror(cb) {
      onerror = cb
    },
    get onerror() {
      return onerror
    },
  }

  const wm = new WorkerManager({}, () => ({
    worker: fakeWorker as unknown as Worker,
    status: 'free',
  }))

  const result: any = await new Promise((resolve) => {
    wm.task(add, {
      metaUrl: import.meta.url,
      onFinish: resolve,
    }).invoke(1, 2)
  })

  assertEquals(result.response, null)
  assertEquals(result.error.message, 'boom')
  assertSpyCalls(loggerSpy, 1)

  loggerSpy.restore()
})

Deno.test('manual worker close', () => {
  const wm = new WorkerManager()
  wm.close() // verify close
})

Deno.test('WorkerManager: permissions option genuinely restricts a worker', async () => {
  Deno.env.set('WORKER_MANAGER_TEST_VAR', 'visible')

  try {
    // Unrestricted (default) — the task can see the host's env, same as any pre-existing caller.
    const wmUnrestricted = new WorkerManager()
    const unrestricted: any = await new Promise((resolve) => {
      wmUnrestricted.task(readEnv, {
        metaUrl: new URL('./tasks.ts', import.meta.url).href,
        onFinish: resolve,
        autoClose: true,
      }).invoke()
    })
    assertEquals(unrestricted.error, null)
    assertEquals(unrestricted.response, 'visible')

    // Restricted — denying `env` must produce a real Deno permission error inside the worker,
    // never a silently-successful read, proving `permissions` is actually enforced and not just
    // threaded through unused. `read: true` stays granted here — an object permission profile
    // replaces the whole set (unlisted categories default to fully denied, not "inherited"), and
    // the worker needs `read` just to import its own task module before `readEnv` ever runs.
    const wmRestricted = new WorkerManager({
      permissions: { env: false, read: true },
    })
    const restricted: any = await new Promise((resolve) => {
      wmRestricted.task(readEnv, {
        metaUrl: new URL('./tasks.ts', import.meta.url).href,
        onFinish: resolve,
        autoClose: true,
      }).invoke()
    })
    assertEquals(restricted.response, null)
    assert(restricted.error)
    assert(restricted.error.message.includes('Requires env access'))
  } finally {
    Deno.env.delete('WORKER_MANAGER_TEST_VAR')
  }
})
