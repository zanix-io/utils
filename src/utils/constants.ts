import type { Editors } from 'typings/editor.ts'

export const CONFIG_FILE = 'deno.json'

export const GITHUB_HOOKS_FOLDER = '.github/hooks'
export const GITHUB_WORKFLOW_FOLDER = '.github/workflows'
export const GIT_HOOKS_FOLDER = '.git/hooks'

export const editors: Record<Editors, { FOLDER: string; FILENAME: string }> = {
  vscode: { FOLDER: '.vscode', FILENAME: 'settings.json' },
}

const ZANIX_LOGO: string = `
 ______               _       
|___  /              (_)      
   / /   __ _  _ __   _ __  __
  / /   / _\` || '_ \\ | |\\ \\/ /
./ /___| (_| || | | || | >  < 
\\_____/ \\__,_||_| |_||_|/_/\\_\\                       

`

/** Available constanst to export in the main module*/
export default {
  /**
   * The name of the configuration file used for the Deno project.
   * Defaults to 'deno.json', which contains the project's settings and configurations.
   */
  CONFIG_FILE,
  /**
   * Represents the ZANIX logo as a string.
   * This constant holds the text-based representation of the ZANIX logo
   * that can be used for displaying in the console or logs.
   */
  ZANIX_LOGO,
}
