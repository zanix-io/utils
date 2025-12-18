// deno-lint-ignore-file no-explicit-any
import { WorkerManager } from 'modules/workers/manager.ts'
import { assert, assertArrayIncludes, assertEquals } from '@std/assert'
import {
  add,
  asyncMultiply,
  healthy,
  inmetiateError,
  loopError,
  recurseError,
  timeoutError,
} from './tasks.ts'
import 'modules/logger/mod.ts' // initialize logger

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
  assertEquals(result, { error: null, response: 5, _wasWorkerThread: true, _workerId: 0 })

  // trying to execute another task on worker open
  const resultClosed: any = await new Promise((resolve) => {
    const task = wm.task(add, {
      metaUrl: new URL('./tasks.ts', import.meta.url).href,
      onFinish: resolve,
    })
    task.invoke(4, 5)
  })

  delete resultClosed.messageId
  assertEquals(resultClosed, { error: null, response: 9, _wasWorkerThread: true, _workerId: 0 })
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
  assertEquals(result, { error: null, response: 20, _wasWorkerThread: true, _workerId: 0 })

  // trying to execute another task after closed, it generates a new worker

  const resultClosed: any = await new Promise((resolve) => {
    const task = wm.task(asyncMultiply, {
      metaUrl: new URL('./tasks.ts', import.meta.url).href,
      onFinish: resolve,
    })
    task.invoke(3, 5)
  })

  delete resultClosed.messageId
  assertEquals(resultClosed, { error: null, response: 15, _wasWorkerThread: true, _workerId: 0 })
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
    [{ '2': 'OK' }, { '3': 3 }, { '1': 2 }, { '4': 6 }, { '4': 9 }, { '4': 12 }],
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

Deno.test('Inmmediate worker error', async () => {
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

Deno.test('manual worker close', () => {
  const wm = new WorkerManager()
  wm.close() // verify close
})
