import type { TaskerCallback } from 'typings/workers.ts'

/**
 * The builder compiler options
 */
export type CompilerOptions = {
  /**
   * The path to the source file that will be compiled. Defaults to Zanix mod.
   */
  inputFile: string
  /**
   * The path where the compiled and obfuscated file will be saved. Defaults to Zanix dist file.
   */
  outputFile: string
  /**
   *  An optional flag to indicate if outputFile will be obfuscate. Defaults to `false`.
   */
  obfuscate?: boolean
  /**
   * A flag that determines whether a worker should be used for processing.
   * Only set to true when necessary, as using workers can add overhead.
   */
  useWorker?: boolean
  /**
   * A flag indicating if outputFile will be minify. Defaults to `true`.
   */
  minify: boolean
  /**
   * A flag indicating whether bundling will be applied (i.e., grouping all files into a single output). Defaults to `true`.
   */
  bundle: boolean
  /**
   * Callback function to be executed when the process is complete.
   * It is invoked once the task or operation finishes successfully.
   */
  callback?: TaskerCallback
}
