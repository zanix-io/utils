import type { WorkflowOptions } from 'typings/github.ts'

import { createWorkflow } from './main.ts'

/**
 * Creates a `GitHub Actions` workflow to automatically run tests during the publish process.
 *
 * @param options The options for configuring the workflow.
 *   - `baseFolder`: The directory where the workflow file should be created.
 *   - `mainBranch`: The main branch that will trigger the workflow when publishing a new version.
 *
 * @category helpers
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
