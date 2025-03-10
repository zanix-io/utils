import type { DefaultFormattedLog, Formatter } from 'typings/logger.ts'

import { generateBasicUUID } from 'utils/identifiers.ts'
import { showMessage } from 'modules/logger/base.ts'

const defaultFormatter: Formatter<DefaultFormattedLog> = (level, [message, ...data]) => {
  const timestamp = new Date().toISOString()
  let userId = null
  try {
    userId = Deno.uid()
  } catch {
    //ignore
  }

  return {
    id: generateBasicUUID(),
    level,
    message,
    timestamp,
    data,
    context: {
      userId,
    },
  }
}

// The default logs formatter
export function baseFormatter(
  formatter: Formatter = defaultFormatter,
): Formatter<DefaultFormattedLog> {
  return (level, log) => {
    try {
      return formatter(level, log) as DefaultFormattedLog
    } catch (e) {
      showMessage('warn', 'Custom formatter failed. Default formatter has been applied instead.', {
        cause: e,
      })
      return defaultFormatter(level, log)
    }
  }
}
