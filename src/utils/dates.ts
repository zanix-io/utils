/** Current local time */
export function getLocalTime(): string {
  const localTime = new Date().toLocaleTimeString()
  return localTime
}

/** Current UTC time */
export function getUtcTime(): string {
  const currentDate = new Date()
  const utcTime = currentDate.toISOString().split('T')[1]

  return utcTime
}

/** Current ISO date */
export function getISODate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
