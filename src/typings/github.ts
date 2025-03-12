import type { GITHUB_HOOKS_FOLDER as _baseDir } from 'utils/constants.ts'
import type { LinterAvailableFiles } from 'typings/files.ts'

export type BaseGithubHelperOptions = {
  /** The folder where the hook should be created. Defaults to {@link _baseDir} */
  baseFolder?: string
}
export type HookOptions = BaseGithubHelperOptions & {
  /**  A flag indicating whether a symbolic link should be created in the GitHub hooks directory. */
  createLink?: boolean
}

export type PreCommitHookOptions = HookOptions & {
  /** An array of file extensions to be linted and formatted */
  fileType?: LinterAvailableFiles[]
}

export type WorkflowOptions = BaseGithubHelperOptions & {
  /**
   * The main branch where the version should be published using the workflow.
   * This specifies the primary branch for version deployment.
   * Defaults to `master`
   */
  mainBranch?: string
}
