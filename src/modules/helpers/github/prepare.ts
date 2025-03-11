import type { HookOptions, PreCommitHookOptions, WorkflowOptions } from 'typings/github.ts'

import { createPrePushHook } from 'modules/helpers/github/hooks/pre-push.ts'
import { createPreCommitHook } from 'modules/helpers/github/hooks/pre-commit.ts'
import { createPublishWorkflow } from 'modules/helpers/github/workflows/publish.ts'

/**
 * Prepares the GitHub environment by setting up necessary hooks and workflows.
 * This function ensures that the pre-commit hook, pre-push hook, and publish workflow are created.
 *
 * @param {Object} options - Configuration options for setting up hooks and workflows.
 * @param {PreCommitHookOptions} [options.preCommitHook] - Optional configuration for the pre-commit hook.
 * @param {HookOptions} [options.pushHook] - Optional configuration for the pre-push hook.
 * @param {WorkflowOptions} [options.publishWorkflow] - Optional configuration for the publish workflow.
 */
export function prepareGithub(options: {
  preCommitHook?: PreCommitHookOptions
  pushHook?: HookOptions
  publishWorkflow?: WorkflowOptions
} = {}): Promise<boolean[]> {
  const { preCommitHook, pushHook, publishWorkflow } = options
  return Promise.all([
    createPreCommitHook(preCommitHook),
    createPrePushHook(pushHook),
    createPublishWorkflow(publishWorkflow),
  ])
}
