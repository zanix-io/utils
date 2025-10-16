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
import { createPreCommitYaml } from 'modules/helpers/github/files/pre-commit-config.ts'

type Options = {
  /**
   * legacyHooks options to create main github hooks without using the framework
   *    - `preCommitHook`
   *    - `pushHook`
   */
  legacyHooks?: {
    /**
     * createPreCommitHook options
     *   - `baseFolder`: The folder where the hook should be created.
     *   - `createLink`: A flag indicating whether a symbolic link should be created in the GitHub hooks directory.
     *   - `filePatterns` - The filePatterns property is an optional configuration object that defines the file patterns for linting and formatting operations.
     */
    preCommit?: PreCommitHookOptions
    /**
     * createPrePushHook options
     *   - `baseFolder`: The folder where the hook should be created.
     *   - `createLink`: A flag indicating whether a symbolic link should be created in the GitHub hooks directory.
     */
    prePush?: HookOptions
  }
  /**
   * usePrecommit option to use pre-commit framework
   */
  usePrecommit?: true | Omit<BaseGithubHelperOptions, 'baseFolder'>
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
  gitIgnoreBase?: Omit<BaseGithubHelperOptions, 'baseFolder'>
}

/**
 * Prepares the `GitHub` environment by setting up necessary hooks and workflows.
 * This function ensures that the pre-commit hook, pre-push hook, publish workflow, and `.gitignore` are created.
 *
 * @param {Object} options - Configuration options for setting up hooks and workflows.
 * @param {PreCommitHookOptions} [options.usePrecommit] - Optional configuration for using the pre-commit framework.
 * @param {PreCommitHookOptions} [options.legacyHooks] - Optional configuration for the pre-commit and pre-push hooks.
 * @param {WorkflowOptions} [options.publishWorkflow] - Optional configuration for the publish workflow.
 * @param {WorkflowOptions} [options.gitIgnoreBase] - Optional configuration for the publish workflow.
 *
 * @category helpers
 */

export function prepareGithub(options: Omit<Options, 'legacyHooks'>): Promise<boolean[]>
export function prepareGithub(options: Omit<Options, 'usePrecommit'>): Promise<boolean[]>
export function prepareGithub(options: Options = {}): Promise<boolean[]> {
  const { legacyHooks = {}, publishWorkflow, gitIgnoreBase, usePrecommit } = options
  const promises = [createGitWorkflow(publishWorkflow), createIgnoreBaseFile(gitIgnoreBase)]

  if (usePrecommit) {
    promises.push(createPreCommitYaml(typeof usePrecommit !== 'boolean' ? usePrecommit : undefined))
  } else {
    promises.push(createPreCommitHook(legacyHooks.preCommit))
    promises.push(createPrePushHook(legacyHooks.prePush))
  }
  return Promise.all(promises)
}
