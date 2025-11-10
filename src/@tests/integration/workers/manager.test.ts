import { WorkerManager } from 'modules/workers/manager.ts'
import { assert, assertEquals } from '@std/assert'
import { add, asyncMultiply } from './tasks.ts'

Deno.test('execute synchronous task in worker', async () => {
  const wm = new WorkerManager()
  const result = await new Promise((resolve) => {
    const invoker = wm.task(add, {
      metaUrl: new URL('./tasks.ts', import.meta.url).href,
      onFinish: resolve,
    })
    invoker.invoke(2, 3)
  })

  assertEquals(result, { error: null, response: 5, _wasWorkerThread: true })

  // trying to execute another task on worker open
  const resultClosed = await new Promise((resolve) => {
    const task = wm.task(add, {
      metaUrl: new URL('./tasks.ts', import.meta.url).href,
      onFinish: resolve,
    })
    task.invoke(4, 5)
  })

  assertEquals(resultClosed, { error: null, response: 9, _wasWorkerThread: true })
})

Deno.test('execute asynchronous task in worker', async () => {
  const wm = new WorkerManager()
  assert(wm['isOpen'])

  const result = await new Promise((resolve) => {
    const task = wm.task(asyncMultiply, {
      metaUrl: new URL('./tasks.ts', import.meta.url).href,
      onFinish: resolve,
      autoClose: true,
    })
    task.invoke(4, 5)
  })
  assert(!wm['isOpen'])

  assertEquals(result, { error: null, response: 20, _wasWorkerThread: true })

  // trying to execute another task after closed, it generates a new worker

  const resultClosed = await new Promise((resolve) => {
    const task = wm.task(asyncMultiply, {
      metaUrl: new URL('./tasks.ts', import.meta.url).href,
      onFinish: resolve,
    })
    task.invoke(3, 5)
  })
  assertEquals(resultClosed, { error: null, response: 15, _wasWorkerThread: true })
  assert(wm['isOpen'])
})

Deno.test('manual worker close', () => {
  const wm = new WorkerManager()
  wm.close() // verify close
})
