import type { HookOptions } from 'typings/github.ts'

import { createHook } from './main.ts'

/**
 * Creates a pre-push hook for run tests.
 *
 * This function generates a pre-push hook that runs `deno test`.
 * It will also add the necessary permissions to the hook and create a symbolic link to `.git/hooks/pre-push`.
 *
 * @param options The create hook options.
 *   - `baseFolder`: The folder where the hook should be created.
 *   - `createLink`: A flag indicating whether a symbolic link should be created in the GitHub hooks directory.
 */
export function createPrePushHook(
  options: HookOptions = {},
): Promise<boolean> {
  const filename = 'pre-push'

  return createHook({ filename, ...options })
}
