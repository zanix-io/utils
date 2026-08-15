import type { DefaultFormattedLog, Formatter } from 'typings/logger.ts'

import { generateUUID } from 'utils/identifiers.ts'
import { showMessage } from 'modules/logger/base.ts'
import { serializeError } from 'modules/errors/serialize.ts'
import { createRedactor } from 'modules/errors/redact.ts'

const defaultFormatter: Formatter<DefaultFormattedLog> = (
  level,
  [message, ...data],
) => {
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

  // `Error` instances (unlike plain objects) collapse to `{}` under `JSON.stringify` — their
  // `name`/`message`/`stack` live on non-enumerable own properties. `error()` already guards
  // against this via `serializeMultipleErrors`; every other persisted level (`info`/`warn`) can
  // just as easily receive an `Error` as extra context (e.g. `logger.warn('X failed', err)`), so
  // this normalizes it here instead of duplicating the check in each method. Redaction itself
  // already happened once in `Logger#log`, upstream of this formatter (and of any custom one),
  // using this instance's own configured pattern — `redact: false` here means `serializeError`
  // only flattens the (already-safe) `Error` into a plain shape, instead of redacting it a second
  // time with its own unrelated default pattern.
  if (data.length) {
    formatted.data = data.map((entry) =>
      entry instanceof Error ? serializeError(entry, { redact: false }) : entry
    )
  }

  return formatted
}

// The default logs formatter
export function baseFormatter(
  formatter: Formatter = defaultFormatter,
  redact: ReturnType<typeof createRedactor> = createRedactor(),
): Formatter<DefaultFormattedLog> {
  return (level, log) => {
    try {
      return formatter(level, log) as DefaultFormattedLog
    } catch (e) {
      showMessage(
        'warn',
        '[Logger]: Custom formatter failed. Default formatter has been applied instead.',
        redact({ cause: e }),
      )
      return defaultFormatter(level, log)
    }
  }
}
