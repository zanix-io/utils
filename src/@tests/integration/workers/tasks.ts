export function add(a: number, b: number) {
  return a + b
}

export function asyncMultiply(a: number, b: number) {
  return new Promise<number>((resolve) => setTimeout(() => resolve(a * b), 500))
}

export function recurseError() {
  recurseError()
}

export function timeoutError() {
  setTimeout(() => {
    throw new Error('Async Error')
  }, 100)
}

export function promiseRejection() {
  Promise.reject('Error regection')
}

export function inmetiateError() {
  throw new Error('Error')
}

export function healthy() {
  return true
}

export function loopError() {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0)
}
