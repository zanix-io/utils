import type { DefaultFormattedLog, Formatter } from 'typings/logger.ts'

import { generateUUID } from 'utils/identifiers.ts'
import { showMessage } from 'modules/logger/base.ts'

const defaultFormatter: Formatter<DefaultFormattedLog> = (level, [message, ...data]) => {
  const timestamp = new Date().toISOString()
  let processId = null
  try {
    processId = Deno.uid()
  } catch { /** Ignore error */ }

  const formatted = {
    id: generateUUID(),
    level,
    message,
    timestamp,
    context: {
      processId,
    },
  } as DefaultFormattedLog

  if (data.length) formatted.data = data

  return formatted
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
