import { getLogFileName, lastLogFilename } from './file.ts'
import { getISODate } from 'utils/dates.ts'
import { isoDateRegex } from 'utils/regex.ts'

/**
 * Function to define if a file should be deleted
 */
export const shouldBeDeleted = (fileName: string, now: number, expirationDays: number) => {
  const logDate = extractLogDate(fileName)
  if (!logDate) return true
  const fileDate = new Date(logDate).getTime() // Extract the date from the filename

  return (now - fileDate >= expirationDays * 24 * 60 * 60 * 1000)
}

/**
 * Function to extract log date
 */
export const extractLogDate = (file: string) => {
  const match = file.match(new RegExp(isoDateRegex.source.replace('^', '').replace('$', '')))

  return match?.[0]
}

/**
 * Function to clean up expired log files
 */
export const cleanupExpiredLogs = async (logsDir: string, expirationTime: `${number}d`) => {
  if (lastLogFilename === getLogFileName()) return

  await Deno.mkdir(logsDir, { recursive: true })

  const files = Deno.readDir(logsDir)

  const now = new Date(getISODate()).getTime()

  const expirationDays = Number(expirationTime.charAt(0))

  const deletePromises: Promise<void>[] = []
  for await (const file of files) {
    if (file.isDirectory) continue // Ignore directories
    if (shouldBeDeleted(file.name, now, expirationDays)) {
      deletePromises.push(Deno.remove(`${logsDir}/${file.name}`)) // Collect promises
    }
  }

  // Execute all deletions in parallel
  await Promise.all(deletePromises)
}
