import type { DefaultResponse, SaveDataFile, SaveDataFunction } from 'typings/logger.ts'

import { showMessage } from 'modules/logger/base.ts'
import { canUseZnx } from 'modules/helpers/zanix/namespace.ts'
import { TaskerManager } from 'modules/workers/mod.ts'
import { getISODate } from 'utils/dates.ts'
import { join } from '@std/path'
import regex from 'utils/regex.ts'

let lastLogFilename: string
const logFilename = 'log'

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
 * Function to generate the log file name based on the expiration date
 */
export const getLogFileName = () => {
  const isoDate = getISODate()
  lastLogFilename = `${logFilename}-${isoDate}.json`

  return lastLogFilename
}

/**
 * Function to extract log date
 */
export const extractLogDate = (file: string) => {
  const match = file.match(new RegExp(regex.isoDateRegex.source.replace('^', '').replace('$', '')))

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

  for await (const file of files) {
    if (file.isDirectory) return
    if (shouldBeDeleted(file.name, now, expirationDays)) {
      await Deno.remove(`${logsDir}/${file.name}`) // Delete if the log file is older than expiration time
    }
  }
}

/**
 * Default save data function
 */
export const defaultSaveData: SaveDataFunction<
  DefaultResponse,
  Exclude<SaveDataFile & { _fmtLog?: unknown }, 'asFile'>
> = async (
  context,
) => {
  // Workers adaptation
  if (context.useWorker) {
    const { callback } = context
    delete context.callback
    const _fmtLog = context.getFmtLog()
    return new TaskerManager(import.meta.url, defaultSaveData, callback).invoke({
      ...context,
      getFmtLog: undefined as never,
      useWorker: false,
      _fmtLog,
    })
  }

  const data = context._fmtLog || context.getFmtLog()
  const logsDir = context.folder || './.logs'
  const expirationTime = context.expirationTime || '5d'

  // Clean up expired log files after each log
  await cleanupExpiredLogs(logsDir, expirationTime)

  const file = join(logsDir, getLogFileName())

  return Deno.readTextFile(file).then((fileContent) => {
    const currentData = JSON.parse(fileContent)
    currentData.push(data)
    return Deno.writeTextFile(file, JSON.stringify(currentData, null, 2))
  }).catch(() => Deno.writeTextFile(file, JSON.stringify([data], null, 2)))
}

/**
 * Function to handle the log data and append it to the log file
 */
export function baseSaveData(
  saveDataFunction?: SaveDataFile | SaveDataFunction | false,
): SaveDataFunction {
  // Zanix libraries do not save logs if  does not have a custom saveDataFunction.
  if (canUseZnx() && Znx.config.project === 'library' && !saveDataFunction) return () => {}

  let baseContext: Exclude<SaveDataFile, 'asFile'>
  if (typeof saveDataFunction !== 'function') {
    baseContext = typeof saveDataFunction !== 'string' ? saveDataFunction as typeof baseContext : {}
    saveDataFunction = defaultSaveData
  }

  const catcher = (e: unknown) =>
    showMessage(
      'warn',
      'Custom save data function failed. The log could not be saved.',
      {
        cause: e,
      },
    )

  return (context) => {
    try {
      const response = saveDataFunction({ ...context, ...baseContext })
      if (response instanceof Promise) return response.catch(catcher)
      return response
    } catch (e) {
      catcher(e)
    }
  }
}
