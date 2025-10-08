import type { Editors } from 'typings/editor.ts'

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

/**
 * Available constants for internal use only
 */

const GITHUB_HOOKS_FOLDER = '.github/hooks'
const GITHUB_WORKFLOW_FOLDER = '.github/workflows'
const GIT_HOOKS_FOLDER = '.git/hooks'
const editors: Record<Editors, { FOLDER: string; FILENAME: string }> = {
  vscode: { FOLDER: '.vscode', FILENAME: 'settings.json' },
}

export default {
  GITHUB_HOOKS_FOLDER,
  GITHUB_WORKFLOW_FOLDER,
  GIT_HOOKS_FOLDER,
  editors,
}
