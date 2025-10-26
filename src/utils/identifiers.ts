/**
 * Helper to generate a v4 random `uuid`
 *
 * @category helpers
 */
export function generateUUID(): string {
  return crypto.randomUUID()
}
