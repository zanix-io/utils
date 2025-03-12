import type { HookOptions } from 'typings/github.ts'

import { createHook } from './main.ts'

/**
 * Sets up a `pre-push` hook to automatically run tests before pushing changes to the `Git` repository.
 *
 * This function generates a pre-push hook that runs `deno test`.
 * It will also add the necessary permissions to the hook and create a symbolic link to `.git/hooks/pre-push`.
 *
 * @param options The create hook options.
 *   - `baseFolder`: The folder where the hook should be created.
 *   - `createLink`: A flag indicating whether a symbolic link should be created in the GitHub hooks directory.
 *
 * @category helpers
 */
export function createPrePushHook(
  options: HookOptions = {},
): Promise<boolean> {
  const filename = 'pre-push'

  return createHook({ filename, ...options })
}
