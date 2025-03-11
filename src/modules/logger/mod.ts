/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

import { Logger as MainClass } from 'modules/logger/main.ts'

/**
 * @class The main logger class
 *
 * @example
 * Define a logger with a custom save function, where logs are saved according to custom specifications.
 * The save function can be either synchronous or asynchronous.
 *
 * ```ts
 * import { Logger } from 'jsr:@zanix/utils@[version]/logger';
 *
 * // Instantiate the logger with custom storage configuration.
 * const logger = new Logger({
 *   storage: {
 *     async save(context) {
 *       const data = context.getFmtLog();
 *       // Function to save the logs asynchronously
 *     }
 *   }
 * });
 *
 * logger.debug('Some debug information'); // The save function will be called and return a Promise.
 * ```
 *
 * @example
 * Define a logger that saves logs to a file in a specific folder (default is the `.logs/` folder).
 * You can also set an expiration time (in days) for when the log files should be automatically deleted.
 * The default expiration time is 5 days.
 *
 * ```ts
 * import { Logger } from 'jsr:@zanix/utils@[version]/logger';
 *
 * // Instantiate the logger with file-based storage configuration.
 * const logger = new Logger({
 *   storage: {
 *     save: {
 *       folder: 'myCustomFolder',     // Your custom folder for saving logs
 *       expirationTime: '1d'          // Your custom expiration time for log files
 *     }
 *     // Other storage properties
 *   }
 * });
 *
 * logger.debug('Some debug information to save in a file'); // Returns a Promise<void> by default.
 * ```
 *
 * @example
 * You can also enable workers for the default saver functionality as shown below:
 *
 * ```ts
 * import { Logger } from 'jsr:@zanix/utils@[version]/logger';
 *
 * const logger = new Logger({
 *   storage: {
 *     save: {
 *       useWorker: true,   // Enables the use of workers for processing
 *       callback:()=>{}    // Optional callback to ensure completion, only when `useWorker` is set to `true`.
 *       // Other properties can be added here
 *     },
 *     // Additional storage configuration options can go here
 *   }
 * });
 * ```
 *
 * @example
 * In all cases, you can provide a custom log formatter to modify how the logs are saved.
 * The formatter will process the log data before saving.
 *
 * ```ts
 * import { Logger } from 'jsr:@zanix/utils@[version]/logger';
 *
 * // Instantiate the logger with a custom formatter.
 * const logger = new Logger({
 *   storage: {
 *     formatter: (level, logData) => ({level, data: logData}) // your custom log processing logic,
 *     // Other storage properties
 *   }
 * });
 *
 * logger.debug('Some debug information to save in a custom format'); // Logs will be saved with your custom formatter.
 * ```
 *
 * @example
 * By default, logs are saved as files in the default folder. You can disable saving by setting `storage: false` in the options configuration,
 * or you can prevent saving by passing a special flag.
 *
 * ```ts
 * logger.debug('Some debug information without saving', 'noSave'); // The system recognizes 'noSave' as a flag to prevent saving.
 * ```
 *
 * @example
 * When you create a new `Logger` instance, it is stored in both the `Window` context
 * and the `Zanix` (`Znx`) namespace. You can access it via `Znx.logger` or `self.logger`.
 *
 * However, the default logger instance uses a basic response type and is not generic.
 * If you need a globally accessible logger with a specific type, you can define it as follows:
 *
 * ```ts
 * declare global {
 *   const logger: typeof yourNewloggerInstance;
 * }
 * ```
 *
 * @example
 * Accessing the global logger
 *
 * ```ts
 * import 'jsr:@zanix/utils@[version]/logger' // Ensure to call the library before using the global logger
 *
 * Znx.logger.debug('message to log');  // Accessing via Zanix namespace
 * self.logger.debug('message to log');  // Accessing via global context
 * ```
 */
export class Logger extends MainClass {} //Necessary to extend because of docs

/**
 * @instance zanixLogger
 *
 * This provides a default instance of the `Logger` class to help avoid direct usage of `console`,
 * improving log quality and ensuring consistency across your projects.
 *
 * @see {@link Logger}
 */
const logger: Logger = new Proxy(Logger['prototype'], {
  get(_, prop) {
    // Retrieve the current global logger instance, or create a new one if it doesn't exist.
    // This is necessary to replace the default Logger instance with the current global logger (self.logger).
    const logger = self.logger || new Logger()
    return logger[prop as keyof typeof Logger['prototype']].bind(logger)
  },
})

export default logger
