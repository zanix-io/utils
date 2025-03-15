import type {
  BaseGithubHelperOptions,
  HookOptions,
  PreCommitHookOptions,
  WorkflowOptions,
} from 'typings/github.ts'

import { createPrePushHook } from 'modules/helpers/github/hooks/pre-push.ts'
import { createPreCommitHook } from 'modules/helpers/github/hooks/pre-commit.ts'
import { createGitWorkflow } from 'modules/helpers/github/workflows/publish.ts'
import { createIgnoreBaseFile } from 'modules/helpers/github/files/main.ts'

/**
 * Prepares the `GitHub` environment by setting up necessary hooks and workflows.
 * This function ensures that the pre-commit hook, pre-push hook, publish workflow, and `.gitignore` are created.
 *
 * @param {Object} options - Configuration options for setting up hooks and workflows.
 * @param {PreCommitHookOptions} [options.preCommitHook] - Optional configuration for the pre-commit hook.
 * @param {HookOptions} [options.pushHook] - Optional configuration for the pre-push hook.
 * @param {WorkflowOptions} [options.publishWorkflow] - Optional configuration for the publish workflow.
 * @param {WorkflowOptions} [options.gitIgnoreBase] - Optional configuration for the publish workflow.
 *
 * @category helpers
 */
export function prepareGithub(options: {
  /**
   * createPreCommitHook options
   *   - `baseFolder`: The folder where the hook should be created.
   *   - `createLink`: A flag indicating whether a symbolic link should be created in the GitHub hooks directory.
   *   - `filePatterns` - The filePatterns property is an optional configuration object that defines the file patterns for linting and formatting operations.
   */
  preCommitHook?: PreCommitHookOptions
  /**
   * createPrePushHook options
   *   - `baseFolder`: The folder where the hook should be created.
   *   - `createLink`: A flag indicating whether a symbolic link should be created in the GitHub hooks directory.
   */
  pushHook?: HookOptions
  /**
   * createGitWorkflow options
   *   - `baseFolder`: The directory where the workflow file should be created.
   *   - `mainBranch`: The main branch that will trigger the workflow when publishing a new version.
   *   - `projectType`: Optional ZanixProject type to define correct workflow. Defaults to `library`
   */
  publishWorkflow?: WorkflowOptions
  /**
   * createIgnoreBaseFile options
   *   - `baseFolder`: The folder where the `.gitignore` should be created. Defaults to `root`
   */
  gitIgnoreBase?: BaseGithubHelperOptions
} = {}): Promise<boolean[]> {
  const { preCommitHook, pushHook, publishWorkflow, gitIgnoreBase } = options
  return Promise.all([
    createPreCommitHook(preCommitHook),
    createPrePushHook(pushHook),
    createGitWorkflow(publishWorkflow),
    createIgnoreBaseFile(gitIgnoreBase),
  ])
}
