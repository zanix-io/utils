import type { CompilerOptions } from 'typings/builder.ts'

import { denoPlugins } from 'jsr:@luca/esbuild-deno-loader@~0.11.1'
import { defaultNpmModules, npmModulesPlugin } from './plugins/npm-modules.ts'
import logger from 'modules/logger/mod.ts'

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
    npm = '',
    callback,
    onBackground,
    plugins = () => [],
    platform = 'neutral',
    external = [],
    ...options
  }: Omit<
    CompilerOptions & { onBackground?: boolean },
    'useWorker'
  >,
) => {
  const result: { error?: unknown; message?: string } = {}
  const npmExternals = npm.split(',')

  const { build, stop } = await import('npm:esbuild@0.20.2')

  try {
    // Build the file using esbuild
    await build({
      minify,
      bundle,
      plugins: [
        ...denoPlugins(),
        ...plugins(),
        npmModulesPlugin(npmExternals),
      ],
      entryPoints: [inputFile],
      outfile: outputFile,
      platform,
      external: [...defaultNpmModules, ...npmExternals, ...external],
      format: 'esm',
      ...options,
    }).finally(stop)

    // Read the compiled file
    const appContent = await Deno.readTextFile(outputFile)

    const { default: obfuscator } = await import('npm:javascript-obfuscator@^4.0.2')

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
    )

    result.message = 'Build completed'
    callback?.(result)

    return result
  } catch (error) {
    logger.error('Error during compile:', error, 'noSave')

    result.error = error
    callback?.(result)
  }

  return result
}
