import type { BaseGithubHelperOptions } from 'typings/github.ts'

import { createBaseFile } from './base.ts'

/**
 * Generates a base `.gitignore` file to exclude common files and directories from being versioned in a Git repository.
 *
 * @param options The create file options.
 *   - `baseRoot`: The base root directory where the folder should be created. Defaults to root.
 *
 * @category helpers
 */
export function createIgnoreBaseFile(
  options: Omit<BaseGithubHelperOptions, 'baseFolder'> = {},
): Promise<boolean> {
  return createBaseFile({ baseFile: 'ignore.base', filename: '.gitignore', ...options })
}
