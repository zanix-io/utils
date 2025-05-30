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
 * Zanix flags to enable different behaviors of a module:
 *
 * - `'enablePipe'` – Enables pipe functionality for a function,
 *    allowing data transformations to be applied across all data processed by that function.
 *    This flag is useful for SERVER (BACKEND), APP (SSR: Server-Side Rendering), and global functionalities.
 *    It can be specified as `enablePipe:server`, `enablePipe:app`, or `enablePipe:global`.
 *
 * - `'enableModel'` - Enables model-related functionality. This flag is used to activate features related
 *    to the model in the application.
 *
 * - `'useGlobalComponent'` – Activates a global SSR component within the application.
 *    This flag is used to inject specific components into the app, such as the footer, header, suspense, or error components.
 *    It helps standardize the inclusion of global UI elements across different parts of the application.
 *    The components can be specified as useGlobalComponent:footer, useGlobalComponent:header, useGlobalComponent:suspense, or useGlobalComponent:error.
 *
 * -  These flags control the rendering behavior of `pages` in the application.
 *     - `'useServerRender'` enables server-side rendering, allowing components to be rendered on the server before being sent to the client.
 *     - `'useClientRender'` enables client-side rendering, where components are rendered directly in the browser after the page is loaded.
 *     - `'useStaticRender'` enables static rendering, where components are pre-rendered at build time for fast, static pages.
 *    These flags help determine the optimal rendering strategy based on the component's requirements and the desired performance.
 */
export const ZNX_FLAGS = [
  'enablePipe:global',
  'enablePipe:app',
  'enablePipe:server',
  'enableModel',
  'useGlobalComponent:footer',
  'useGlobalComponent:header',
  'useGlobalComponent:suspense',
  'useGlobalComponent:error',
  'useServerRender',
  'useClientRender',
  'useStaticRender',
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
