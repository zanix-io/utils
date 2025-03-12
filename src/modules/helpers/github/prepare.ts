import type {
  BaseGithubHelperOptions,
  HookOptions,
  PreCommitHookOptions,
  WorkflowOptions,
} from 'typings/github.ts'

import { createPrePushHook } from 'modules/helpers/github/hooks/pre-push.ts'
import { createPreCommitHook } from 'modules/helpers/github/hooks/pre-commit.ts'
import { createPublishWorkflow } from 'modules/helpers/github/workflows/publish.ts'
import { createIgnoreBaseFile } from 'modules/helpers/github/files/main.ts'

/**
 * Prepares the `GitHub` environment by setting up necessary hooks and workflows.
 * This function ensures that the pre-commit hook, pre-push hook, publish workflow, and `.gitignore` are created.
 *
 * @param {Object} options - Configuration options for setting up hooks and workflows.
 * @param {PreCommitHookOptions} [options.preCommitHook] - Optional configuration for the pre-commit hook.
 * @param {HookOptions} [options.pushHook] - Optional configuration for the pre-push hook.
 * @param {WorkflowOptions} [options.publishWorkflow] - Optional configuration for the publish workflow.
 * @param {WorkflowOptions} [options.publishWorkflow] - Optional configuration for the publish workflow.
 *
 * @category helpers
 */
export function prepareGithub(options: {
  preCommitHook?: PreCommitHookOptions
  pushHook?: HookOptions
  publishWorkflow?: WorkflowOptions
  gitIgnoreBase?: BaseGithubHelperOptions
} = {}): Promise<boolean[]> {
  const { preCommitHook, pushHook, publishWorkflow, gitIgnoreBase } = options
  return Promise.all([
    createPreCommitHook(preCommitHook),
    createPrePushHook(pushHook),
    createPublishWorkflow(publishWorkflow),
    createIgnoreBaseFile(gitIgnoreBase),
  ])
}
