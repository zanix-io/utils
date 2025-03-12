/**
 * Current local time
 *
 * @category helpers
 */
export function getLocalTime(): string {
  const localTime = new Date().toLocaleTimeString()
  return localTime
}

/**
 * Current `UTC` time
 *
 * @category helpers
 */
export function getUtcTime(): string {
  const currentDate = new Date()
  const utcTime = currentDate.toISOString().split('T')[1]

  return utcTime
}

/**
 * Current `ISO` date
 *
 * @category helpers
 */
export function getISODate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
