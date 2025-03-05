import { build, stop } from 'npm:esbuild@0.20.2'
import obfuscator from 'npm:javascript-obfuscator@^4.0.2'
import { denoPlugins } from 'jsr:@luca/esbuild-deno-loader@^0.11.1'
import { getZanixPaths } from './zanix/projects.ts'

/**
 * Compiles and obfuscates a TypeScript/JavaScript file using esbuild and javascript-obfuscator.
 * @param options - Configuration options for the build process.
 *    - inputFile: The path to the source file that will be compiled. Defaults to Zanix mod.
 *    - outputFile: The path where the compiled and obfuscated file will be saved. Defaults to Zanix dist.
 *    - obfuscate: The flag to indicate if outputFile will be obfuscate.
 */
export async function compileAndObfuscate(
  options: { inputFile?: string; outputFile?: string; obfuscate?: boolean } = {},
) {
  const paths = getZanixPaths()
  const {
    inputFile = paths.files.MOD,
    outputFile = paths.subfolders.dist.files.APP,
    obfuscate,
  } = options

  try {
    // Build the file using esbuild
    await build({
      minify: true,
      plugins: [...denoPlugins()],
      entryPoints: [inputFile],
      outfile: outputFile,
      bundle: true,
      platform: 'node',
      format: 'esm',
    })

    stop()

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
    console.log(`✅ Build and obfuscation completed: ${outputFile}`)
  } catch (error) {
    console.error('❌ Error during build or obfuscation:', error)
  }
}
