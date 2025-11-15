import type { LoggerMethods } from 'typings/logger.ts'

import * as colors from '@std/fmt/colors'
import { getLocalTime } from 'utils/dates.ts'
import { capitalize } from 'utils/encoders.ts'
import { readConfig } from 'modules/helpers/config.ts'

type ChalkColors = 'blue' | 'green' | 'red' | 'yellow' | 'white'

const logMethodInfo: Record<
  LoggerMethods,
  { color: ChalkColors; icon: string; text: string }
> = {
  info: { color: 'blue', icon: '🔵', text: 'INFO' },
  success: { color: 'green', icon: '🟢', text: 'OK' },
  error: { color: 'red', icon: '🔴', text: 'ERROR' },
  warn: { color: 'yellow', icon: '🟡', text: 'WARNING' },
  debug: { color: 'white', icon: '⚪️', text: 'DEBUG' },
}

/**
 * @param method - {@link LoggerMethods}
 */
export const baseHeaderLog = (method: LoggerMethods) => {
  const { color, icon, text } = logMethodInfo[method]

  let appName
  try {
    appName = colors[color](`[${readConfig().name}]`)
    appName = ` ${appName}`
  } catch {
    appName = ''
  }

  const typeFn = colors[
    `bg${capitalize(color)}` as never
  ] as (str: string) => string

  return colors.bold(
    `${icon} ${colors.gray(getLocalTime())} | ${typeFn(` ZNX-${text} `)}${appName}:`,
  )
}

/**
 * @param method - {@link LoggerMethods}
 * @param args - The logger args
 */
export const showMessage = (method: LoggerMethods, ...args: unknown[]) => {
  const logMethod = method === 'success' ? 'info' : method

  // deno-lint-ignore deno-zanix-plugin/no-znx-console
  console[logMethod](baseHeaderLog(method), ...args)
}
