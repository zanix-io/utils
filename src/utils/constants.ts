/**
 * The name of the configuration file used for the Deno project.
 * Defaults to 'deno.json', which contains the project's settings and configurations.
 */
export const CONFIG_FILE: string = 'deno.json'

/**
 * Default distribution file name for compilations
 */
export const DISTRIBUTION_FILE = 'app.mjs'

/**
 * Default main module name.
 */
export const MAIN_MODULE = 'mod.ts'

/**
 * Zanix directive-prologue flags — a plain string-literal expression statement, as the very first
 * statement of a file (the same grammar slot as `'use strict'`), that a Zanix package's own
 * tooling recognizes and acts on. The `use-znx-flags` lint rule rejects any flag-shaped literal
 * (a bare string as a file's first statement) that isn't listed here, so a typo fails loudly at
 * lint time instead of silently doing nothing.
 *
 * - `'use comet'` — marks a file as a `@zanix/space` "Comet": `cometPlugin` (`@zanix/space/vite`)
 *   forces it into its own build output chunk for selective hydration. See `@zanix/space`'s own
 *   `defineComet` for the full convention.
 */
export const ZNX_FLAGS = [
  'use comet',
]

/**
 * Represents the ZANIX logo as a string.
 * This constant holds the text-based representation of the ZANIX logo
 * that can be used for displaying in the console or logs.
 */
export const ZANIX_LOGO: string = `\u200B
 ______               _       
|___  /              (_)      
   / /   __ _  _ __   _ __  __
  / /   / _\` || '_ \\ | |\\ \\/ /
./ /___| (_| || | | || | >  < 
\\_____/ \\__,_||_| |_||_|/_/\\_\\                       
\u200B\n
`
