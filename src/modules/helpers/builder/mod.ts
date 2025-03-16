import type { CompilerOptions } from 'typings/builder.ts'
import type { TaskerCalbackArgs } from 'typings/workers.ts'

import { DISTRIBUTION_FILE, MAIN_MODULE } from 'utils/constants.ts'
import { getZanixPaths } from 'modules/helpers/zanix/tree.ts'
import { TaskerManager } from 'modules/workers/tasker.ts'
import { mainBuilderFunction } from './main.ts'
import { join } from '@std/path'

/**
 * Compiles and obfuscates a TypeScript/JavaScript file using esbuild and javascript-obfuscator.
 * @param options - Configuration options for the build process.
 *    - `inputFile`: The full path to the source file that will be compiled. Defaults to Zanix mod.
 *    - `outputFile`: The full path where the compiled and obfuscated file will be saved. Defaults to Zanix dist file.
 *    - `obfuscate`: A flag to indicate if outputFile will be obfuscate. Defaults to `false`.
 *    - `useWorker`: A flag that determines whether a worker should be utilized for processing. Defaults to `false`.
 *    - `minify`: A flag indicating if outputFile will be minify. Defaults to `true`.
 *    - `bundle`: A flag indicating whether bundling will be applied (i.e., grouping all files into a single output). Defaults to `true`.
 *    - `callback`: Callback function to be executed when the process is complete.
 *
 * This function requires the following permissions:
 * `allow-read`, `allow-env`, `allow-write`, `allow-run`
 *
 * @tags allow-read, allow-env, allow-write, allow-run
 *
 * @category helpers
 */
export function compileAndObfuscate(
  options: Partial<CompilerOptions> = {},
): void | Promise<TaskerCalbackArgs> {
  const paths = getZanixPaths()
  const {
    inputFile = paths.FOLDER + MAIN_MODULE,
    outputFile = paths.subfolders['.dist'].FOLDER + '/' + DISTRIBUTION_FILE,
    useWorker,
    minify = true,
    bundle = true,
    callback = () => {},
    obfuscate,
  } = options

  if (useWorker) {
    const tarker = new TaskerManager(
      join(import.meta.url, '../main.ts'),
      mainBuilderFunction,
      callback,
    )
    return tarker.invoke({ inputFile, outputFile, minify, obfuscate, bundle, onBackground: true })
  } else {
    return mainBuilderFunction({ inputFile, outputFile, minify, obfuscate, bundle, callback })
  }
}
