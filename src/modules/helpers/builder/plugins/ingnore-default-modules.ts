import type { OnResolveArgs, Plugin } from 'esbuild'

/**
 * esbuild plugin to ignore resolution errors for default modules.
 *
 * This plugin intercepts the module resolution process and marks certain modules
 * (like `esbuild` and `javascript-obfuscator`) as external, meaning they will not
 * be bundled and their resolution will be ignored during the build process.
 * This helps to avoid errors related to modules that cannot be resolved or are
 * not required to be included in the final bundle.
 *
 * @returns {Plugin} esbuild plugin to ignore resolution errors for specific modules.
 */
export function ignoreDefaultModulesPlugin(): Plugin {
  return {
    name: 'ignore-default-modules',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args: OnResolveArgs) => {
        // Ignore resolution for specific problematic modules
        if (ignoredDefaultModules.includes(args.path)) {
          return { external: true, path: `npm:${args.path}` } // Send as external npm
        }
        return null
      })
    },
  }
}

export const ignoredDefaultModules = ['esbuild', 'javascript-obfuscator']
