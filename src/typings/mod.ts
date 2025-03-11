import type { Formatter as LoggerFormatter, SaveDataFunction as LoggerSaveData } from './logger.ts'
import type { Logger } from 'modules/logger/main.ts'
import type { TaskerCallback as WorkerTaskerCallback } from 'typings/workers.ts'
import type { Projects } from 'typings/zanix.ts'
import type { HttpErrorCodes as HttpErrors } from 'typings/errors.ts'

type DefaultLogger = typeof Logger['prototype']

/**
 * Global library type modules definition
 */
declare global {
  namespace Znx {
    /** The base config data */
    const config: {
      project?: Projects
      hash?: string
    }
    /** The global logger default instance */
    const logger: DefaultLogger
    namespace logger {
      /** The logger save data custom function */
      type SaveDataFunction = LoggerSaveData
      /** The logger format data custom function */
      type Formatter = LoggerFormatter
    }
    /** The global workers module types */
    namespace workers {
      /** The tasker manager worker callback */
      type TaskerCallback = WorkerTaskerCallback
    }
    namespace errors {
      type HttpErrorCodes = HttpErrors
    }
  }

  interface Window {
    /** The global logger default instance */
    logger: DefaultLogger
    /** The global onmessage function for workers */
    onmessage?: Worker['onmessageerror']
    /** The global postMessage function for workers */
    postMessage?: Worker['postMessage']
  }
}

export {}
