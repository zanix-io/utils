import type { CompilerOptions } from 'typings/builder.ts'

import {
  ignoredDefaultModules,
  ignoreDefaultModulesPlugin,
} from './plugins/ingnore-default-modules.ts'
import { denoPlugins } from '@luca/esbuild-deno-loader'
import obfuscator from 'javascript-obfuscator'
import logger from 'modules/logger/mod.ts'
import { build, stop } from 'esbuild'

/**
 * Base function for worker
 */
export const mainBuilderFunction = async (
  {
    inputFile,
    outputFile,
    minify,
    bundle,
    obfuscate,
    external = '',
    callback,
    onBackground,
    plugins = () => [],
    platform = 'neutral',
    ...options
  }: Omit<
    CompilerOptions & { onBackground?: boolean },
    'useWorker'
  >,
) => {
  const result: { error?: unknown; message?: string } = {}
  try {
    // Build the file using esbuild
    await build({
      minify,
      bundle,
      plugins: [
        ...denoPlugins(),
        ...plugins(),
        ignoreDefaultModulesPlugin(),
      ],
      entryPoints: [inputFile],
      outfile: outputFile,
      platform,
      external: [...ignoredDefaultModules, ...external.split(',')],
      format: 'esm',
      ...options,
    }).finally(stop)

    // Read the compiled file
    const appContent = await Deno.readTextFile(outputFile)

    // Obfuscate the built file
    const finalCode = obfuscate
      ? obfuscator.obfuscate(appContent, {
        compact: true,
        identifierNamesGenerator: 'hexadecimal',
        stringArray: true,
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 1,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersParametersMaxCount: 2,
        stringArrayWrappersType: 'variable',
        stringArrayThreshold: 0.75,
        unicodeEscapeSequence: false,
      }).getObfuscatedCode()
      : appContent

    // Write the obfuscated code back to the file
    await Deno.writeTextFile(outputFile, finalCode)

    logger.success(
      `Build and obfuscation completed ${onBackground ? 'on background' : ''}: ${outputFile}`,
      'noSave',
    )

    result.message = 'Build completed'
    callback?.(result)

    return result
  } catch (error) {
    logger.error('Error during compile:', error, 'noSave')

    result.error = error
    callback?.({ error })
  }

  return result
}
