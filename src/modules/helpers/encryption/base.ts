/**
 * Base function encrypt for arrays
 * @param message
 * @param callback
 * @returns
 */
export function baseEncrypt<T extends string | string[]>(
  message: T,
  callback: (input: string) => Promise<T | boolean>,
) {
  if (typeof message === 'string') return callback(message)

  const values = []
  for (const input of message) {
    values.push(callback(input))
  }

  return Promise.all(values)
}
