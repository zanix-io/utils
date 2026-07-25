// deno-lint-ignore-file no-explicit-any require-await
import { assert, assertEquals } from '@std/assert'
import { LockManager, Semaphore } from 'utils/concurrency.ts'

Deno.test('Semaphore: acquire decreases permits when available', async () => {
  const sem = new Semaphore(2)

  await sem.acquire()
  assertEquals(sem.permits, 1)

  await sem.acquire()
  assertEquals(sem.permits, 0)
})

Deno.test('Semaphore: acquire waits when no permits are available', async () => {
  const sem = new Semaphore(1)

  await sem.acquire() // consume the only permit

  let acquired = false

  // This acquire should block until a permit is released
  const p = sem.acquire().then(() => {
    acquired = true
  })

  // Wait a microtask tick to confirm it's still pending
  await Promise.resolve()
  assertEquals(acquired, false)

  // Releasing should unblock the waiting acquire call
  sem.release()
  await p

  assertEquals(acquired, true)
})

Deno.test('Semaphore: release wakes next waiting task', async () => {
  const sem = new Semaphore(1)

  await sem.acquire() // no permits left

  let task1 = false
  let task2 = false

  const p1 = sem.acquire().then(() => (task1 = true))
  const p2 = sem.acquire().then(() => (task2 = true))

  // At this point, both should be waiting
  await Promise.resolve()
  assertEquals(task1, false)
  assertEquals(task2, false)

  // First release should wake the first waiting task
  sem.release()
  await p1
  assertEquals(task1, true)
  assertEquals(task2, false)

  // Second release should wake the second waiting task
  sem.release()
  await p2
  assertEquals(task2, true)
})

Deno.test('Semaphore: release increases permits when no tasks are waiting', () => {
  const sem = new Semaphore(1)

  const idle = sem.release() // no queue, so permits should increment
  assertEquals(idle, true)
  assertEquals(sem.permits, 2)
})

Deno.test('Semaphore: respects FIFO order in queue', async () => {
  const sem = new Semaphore(1)

  await sem.acquire() // consume the permit

  const order: number[] = []

  const p1 = sem.acquire().then(() => order.push(1))
  const p2 = sem.acquire().then(() => order.push(2))
  const p3 = sem.acquire().then(() => order.push(3))

  // All should be queued
  await Promise.resolve()
  assertEquals(order.length, 0)

  // Release tasks in FIFO order
  sem.release()
  await p1

  sem.release()
  await p2

  sem.release()
  await p3

  assertEquals(order, [1, 2, 3])
})

Deno.test('Semaphore: multiple releases increase permits correctly', () => {
  const sem = new Semaphore(0)

  sem.release()
  assertEquals(sem.permits, 1)

  sem.release()
  assertEquals(sem.permits, 2)

  const idle = sem.release()
  assertEquals(idle, true)
  assertEquals(sem.permits, 3)
})

Deno.test('Semaphore: acquire returns immediately when a permit is available', async () => {
  const sem = new Semaphore(1)

  let acquired = false

  const p = sem.acquire().then(() => {
    acquired = true
  })

  await p
  assert(acquired)
  assertEquals(sem.permits, 0)
})

Deno.test('LockManager: enforces exclusive lock per key (default 1 permit)', async () => {
  const manager = new LockManager()

  let running = 0
  let maxRunning = 0

  const fn = async () => {
    running++
    maxRunning = Math.max(maxRunning, running)
    await new Promise((resolve) => setTimeout(resolve, 10))
    running--
  }

  const p1 = manager.withLock('A', fn)
  const p2 = manager.withLock('A', fn)

  await Promise.all([p1, p2])

  // Only one should run at the same time for the same key
  assertEquals(maxRunning, 1)
})

Deno.test('LockManager: different keys run in parallel', async () => {
  const manager = new LockManager()

  let running = 0
  let maxRunning = 0

  const fn = async () => {
    running++
    maxRunning = Math.max(maxRunning, running)
    await new Promise((resolve) => setTimeout(resolve, 10))
    running--
  }

  const p1 = manager.withLock('A', fn)
  const p2 = manager.withLock('B', fn)

  await Promise.all([p1, p2])

  // Different keys should execute concurrently
  assert(maxRunning >= 2)
})

Deno.test('LockManager: semaphore is removed from map when idle', async () => {
  const manager = new LockManager()

  assertEquals((manager as any).locks.size, 0)

  await manager.withLock('test', async () => {})

  // Once the lock is released and no pending tasks remain,
  // the semaphore should be removed
  assertEquals((manager as any).locks.size, 0)
})

Deno.test('LockManager: does not remove semaphore if tasks still pending', async () => {
  const manager = new LockManager()

  const a1 = manager.withLock('x', async () => {
    await new Promise((resolve) => setTimeout(resolve, 10))
  })

  const a2 = manager.withLock('x', async () => {})

  // While tasks are executing, semaphore must be present
  assertEquals((manager as any).locks.size, 1)

  await Promise.all([a1, a2])

  // After both tasks finish, it should be cleaned up
  assertEquals((manager as any).locks.size, 0)
})

Deno.test('LockManager: reuses semaphore for the same key', async () => {
  const manager = new LockManager()

  await manager.withLock('k', async () => {})
  assertEquals((manager as any).locks.size, 0) // cleaned after release

  await manager.withLock('k', async () => {})
  assertEquals((manager as any).locks.size, 0) // cleaned again
})

Deno.test('LockManager: enforces FIFO order based on underlying semaphore', async () => {
  const manager = new LockManager()

  const order: number[] = []

  const fn1 = () =>
    manager.withLock('fifo', async () => {
      order.push(1)
      await new Promise((resolve) => setTimeout(resolve, 10))
    })

  const fn2 = () =>
    manager.withLock('fifo', async () => {
      order.push(2)
    })

  const fn3 = () =>
    manager.withLock('fifo', async () => {
      order.push(3)
    })

  const p1 = fn1()
  const p2 = fn2()
  const p3 = fn3()

  await Promise.all([p1, p2, p3])

  // Tasks must execute in the same order they request the lock
  assertEquals(order, [1, 2, 3])
})

Deno.test('LockManager: releases lock even if the function throws', async () => {
  const manager = new LockManager()

  let secondExecuted = false

  const failingFn = async () => {
    throw new Error('fail')
  }

  const succeedingFn = async () => {
    secondExecuted = true
  }

  try {
    await manager.withLock('err', failingFn)
  } catch (_err) {
    // Expected error
  }

  // The next call must still run, meaning the lock was properly released
  await manager.withLock('err', succeedingFn)

  assert(secondExecuted)
})
