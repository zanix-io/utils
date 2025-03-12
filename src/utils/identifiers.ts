/**
 * Helper to generate a basic random `uuid`
 *
 * @category helpers
 */
export function generateBasicUUID(): string {
  const randomHex = (length: number): string =>
    Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('')

  const uuid = `${randomHex(8)}-${randomHex(4)}-4${randomHex(3)}-${
    (8 + Math.floor(Math.random() * 4)).toString(16)
  }${randomHex(3)}-${randomHex(12)}`

  return uuid
}
