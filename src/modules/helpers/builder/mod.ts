import type { CompilerOptions } from 'typings/builder.ts'
import type { TaskerCalbackArgs } from 'typings/workers.ts'

import { TaskerManager } from 'modules/workers/tasker.ts'
import { getZanixPaths } from 'modules/helpers/zanix/projects.ts'
import { mainBuilderFunction } from './main.ts'
import { join } from '@std/path'

/**
 * Compiles and obfuscates a TypeScript/JavaScript file using esbuild and javascript-obfuscator.
 * @param options - Configuration options for the build process.
 *    - `inputFile`: The path to the source file that will be compiled. Defaults to Zanix mod.
 *    - `outputFile`: The path where the compiled and obfuscated file will be saved. Defaults to Zanix dist.
 *    - `obfuscate`: A flag to indicate if outputFile will be obfuscate. Defaults to `false`.
 *    - `useWorker`: A flag that determines whether a worker should be utilized for processing. Defaults to `false`.
 *    - `minify`: A flag indicating if outputFile will be minify. Defaults to `true`.
 *    - `bundle`: A flag indicating if bundle will be apply. Defaults to `true`.
 *    - `callback`: Callback function to be executed when the process is complete.
 *
 * This function requires the following permissions:
 * `allow-read`, `allow-env`, `allow-write`, `allow-run`
 */
export function compileAndObfuscate(
  options: Partial<CompilerOptions> = {},
): void | Promise<TaskerCalbackArgs> {
  const paths = getZanixPaths()
  const {
    inputFile = paths.files.MOD,
    outputFile = paths.subfolders.dist.files.APP,
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
