import type { WorkflowOptions } from 'typings/github.ts'

import { createWorkflow } from './main.ts'

/**
 * Creates a `GitHub Actions` workflow to automatically run tests during the publish process.
 *
 * @param options The options for configuring the workflow.
 *   - `baseFolder`: The directory where the workflow file should be created.
 *   - `mainBranch`: The main branch that will trigger the workflow when publishing a new version.
 *   - `projectType`: Optional ZanixProject type to define correct workflow. Defaults to `library`
 *
 * @category helpers
 */
export function createPublishWorkflow(
  options: WorkflowOptions = {},
): Promise<boolean> {
  const { mainBranch = 'master', projectType = 'library', ...opts } = options
  const filename = projectType === 'library' ? 'publish' : null

  return createWorkflow(
    { filename, ...opts },
    (content) => content.replace('${MAIN_BRANCH}', mainBranch),
  )
}
