import type { CompilerOptions } from 'typings/builder.ts'

import { denoPlugins } from '@luca/esbuild-deno-loader'
import { build, stop } from 'esbuild'
import obfuscator from 'javascript-obfuscator'
import logger from 'modules/logger/mod.ts'

/**
 * Base function for worker
 */
export const mainBuilderFunction = async (
  { inputFile, outputFile, minify, bundle, obfuscate, callback, onBackground }: Omit<
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
      plugins: [...denoPlugins()],
      entryPoints: [inputFile],
      outfile: outputFile,
      platform: 'node',
      format: 'esm',
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
    logger.error('Error during build or obfuscation:', error, 'noSave')

    result.error = error
    callback?.({ error })
  }

  return result
}
