import type { PreCommitHookOptions } from 'typings/github.ts'

import { createHook } from './main.ts'

/**
 * Creates a pre-commit hook for linting and formatting staged files.
 *
 * This function generates a pre-commit hook that runs `deno fmt` and `deno lint` on the staged files with the specified file type(s).
 * It will also add the necessary permissions to the hook and create a symbolic link to `.git/hooks/pre-commit`.
 *
 * @param options The create hook options.
 *   - `baseFolder`: The folder where the hook should be created.
 *   - `createLink`: A flag indicating whether a symbolic link should be created in the GitHub hooks directory.
 *   - `fileType` - An array of file extensions to be linted and formatted (e.g., `['ts', 'tsx', 'js', 'jsx', 'md', 'json']`).
 *                   Defaults to `['ts', 'tsx', 'js', 'jsx', 'md', 'json']` if not provided.
 */
export function createPreCommitHook(
  options: PreCommitHookOptions = {},
): Promise<boolean> {
  const filename = 'pre-commit'
  const { fileType = ['ts', 'tsx', 'js', 'jsx', 'md', 'json'], ...opts } = options
  return createHook(
    { filename, ...opts },
    (content) => content.replace('FILE_EXTENSIONS', fileType.join('|')),
  )
}
