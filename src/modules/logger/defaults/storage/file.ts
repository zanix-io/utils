import { getISODate } from 'utils/dates.ts'

export let lastLogFilename: string
const logFilename = 'log'

/**
 * Function to generate the log file name based on the expiration date
 */
export const getLogFileName = () => {
  const isoDate = getISODate()
  lastLogFilename = `${logFilename}-${isoDate}.json`

  return lastLogFilename
}
