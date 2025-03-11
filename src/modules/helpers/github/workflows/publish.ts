import type { WorkflowOptions } from 'typings/github.ts'

import { createWorkflow } from './main.ts'

/**
 * Creates a pre-push hook for run tests.
 *
 * This function generates a pre-push hook that runs `deno test`.
 * It will also add the necessary permissions to the hook and create a symbolic link to `.git/hooks/pre-push`.
 *
 * @param options The create hook options.
 *   - `baseFolder`: The folder where the hook should be created.
 *   - `mainBranch`: The main branch where the version should be published using the workflow.
 */
export function createPublishWorkflow(
  options: WorkflowOptions = {},
): Promise<boolean> {
  const filename = 'publish'
  const { mainBranch = 'master', ...opts } = options
  return createWorkflow(
    { filename, ...opts },
    (content) => content.replace('${MAIN_BRANCH}', mainBranch),
  )
}
