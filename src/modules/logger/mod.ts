/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

import { Logger as LoggerMainClass } from 'modules/logger/main.ts'

/**
 * The main logger class that provides various options for logging with customizable behavior.
 * You can configure the logger to save logs to different locations, use custom formats, and even
 * enable workers for processing logs asynchronously.
 *
 * ### Examples:
 * @example
 *
 * #### 1. Custom Save Function (Synchronous or Asynchronous)
 *
 * Define a logger with a custom save function where logs are saved according to custom specifications.
 * The save function can be either synchronous or asynchronous.
 *
 * ```ts
 * import { Logger } from 'jsr:@zanix/utils@[version]/logger';
 *
 * // Instantiate the logger with a custom storage configuration.
 * const logger = new Logger({
 *   storage: {
 *     async save(context) {
 *       const data = context.getFmtLog();
 *       // Function to save logs asynchronously
 *     }
 *   }
 * });
 *
 * logger.debug('Some debug information'); // The save function will be called and return a Promise.
 * ```
 *
 * #### 2. File-based Log Saving with Expiration
 *
 * Define a logger that saves logs to a specific folder (default is `.logs/`) and automatically deletes
 * files after a set expiration time (default is 5 days).
 *
 * ```ts
 * import { Logger } from 'jsr:@zanix/utils@[version]/logger';
 *
 * // Instantiate the logger with file-based storage configuration.
 * const logger = new Logger({
 *   storage: {
 *     save: {
 *       folder: 'myCustomFolder',     // Custom folder for saving logs
 *       expirationTime: '1d'          // Expiration time for log files
 *     }
 *   }
 * });
 *
 * logger.debug('Some debug information to save in a file'); // Returns a Promise<void> by default.
 * ```
 *
 * #### 3. Enable Workers for Log Processing
 *
 * You can enable workers to handle the log saving asynchronously.
 *
 * ```ts
 * import { Logger } from 'jsr:@zanix/utils@[version]/logger';
 *
 * const logger = new Logger({
 *   storage: {
 *     save: {
 *       useWorker: true,    // Enable the use of workers for processing logs
 *       callback: () => {}  // Optional callback to ensure completion when `useWorker` is set to `true`
 *     }
 *   }
 * });
 * ```
 *
 * #### 4. Custom Log Formatter
 *
 * You can define a custom formatter to process log data before saving.
 *
 * ```ts
 * import { Logger } from 'jsr:@zanix/utils@[version]/logger';
 *
 * // Instantiate the logger with a custom formatter.
 * const logger = new Logger({
 *   storage: {
 *     formatter: (level, logData) => ({level, data: logData}) // Custom log processing logic
 *   }
 * });
 *
 * logger.debug('Some debug information to save in a custom format'); // Logs will be saved with the custom formatter.
 * ```
 *
 * #### 5. Prevent Log Saving
 *
 * By default, logs are saved as files in the default folder. To prevent saving, set `storage: false` or
 * pass a special flag to stop saving the log.
 *
 * ```ts
 * logger.debug('Some debug information without saving', 'noSave'); // The system recognizes 'noSave' as a flag to prevent saving.
 * ```
 *
 * #### 6. Accessing Logger Globally
 *
 * When creating a new `Logger` instance, it is stored both in the `Window` context and the `Zanix` (`Znx`) namespace.
 * You can access the logger globally via `Znx.logger` or `self.logger`.
 *
 * ##### Option 1: Declare a Global Constant `logger`
 *
 * You can declare a global constant to access the logger globally.
 *
 * ```ts
 * declare global {
 *   const logger: typeof yourNewloggerInstance;
 * }
 * ```
 * This makes the `logger` accessible globally without importing it in other files.
 *
 * ##### Option 2: Add `logger` to the `Window` Interface (Browser)
 *
 * For browser environments, add `logger` as a property of the `Window` interface.
 *
 * ```ts
 * declare global {
 *    interface Window {
 *      logger: DefaultLogger;
 *    }
 * }
 * ```
 * This allows you to access `logger` via `window.logger` (or `self.logger`).
 *
 * Once declared, the global logger can be accessed from anywhere in your application.
 *
 * ```ts
 * import 'jsr:@zanix/utils@[version]/logger';  // Ensure the library is imported before using the global logger
 *
 * Znx.logger.debug('message to log');  // Accessing via Zanix namespace
 * self.logger.debug('message to log');  // Accessing via global context
 * logger.debug('message to log');  // Accessing via global context
 * ```
 */
export class Logger extends LoggerMainClass {} //Necessary to extend because of docs

new Logger() // Creating the first instance of Logger

/**
 * This provides a default instance of the `Logger` class to help avoid direct usage of `console`,
 * improving log quality and ensuring consistency across your projects.
 *
 * @instance zanixLogger
 *
 * @see {@link Logger}
 */
const logger: Logger = new Proxy(Logger['prototype'], {
  get(_, prop) {
    // Retrieve the current global logger instance
    // This is necessary to replace the default Logger instance with the current global logger (self.logger).
    const logger = self.logger
    return logger[prop as keyof typeof logger].bind(logger)
  },
})

export default logger
