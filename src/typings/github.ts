import type { FormatAvailableFiles, LinterAvailableFiles } from 'typings/files.ts'
import type { ZanixProjects } from 'typings/zanix.ts'

/** Base options shared by the GitHub helpers that create files or hooks. */
export type BaseGithubHelperOptions = {
  /** The folder where the file/hook should be created. Defaults vary per helper. */
  baseFolder?: string
  /** The current directory */
  baseRoot?: string
}
/** Options accepted by {@link createHook}. */
export type HookOptions = BaseGithubHelperOptions & {
  /**  A flag indicating whether a symbolic link should be created in the GitHub hooks directory. */
  createLink?: boolean
}

/** Options accepted by {@link createPreCommitHook}. */
export type PreCommitHookOptions = HookOptions & {
  /**
   * The filePatterns property is an optional configuration object that defines the file patterns for linting and formatting operations.
   */
  filePatterns?: {
    /** This parameter specifies the types of files that should be checked by the linter.  */
    lint?: LinterAvailableFiles[]
    /** This parameter defines which file types should be automatically formatted. */
    fmt?: FormatAvailableFiles[]
  }
}

/** The workflow types */
export type WorkFlowTypes = 'publish' | null

/** Options accepted by {@link createGitWorkflow}. */
export type WorkflowOptions = BaseGithubHelperOptions & {
  /**
   * The Zanix project type the workflow should be generated for. Defaults to `'library'`.
   */
  projectType?: ZanixProjects
  /**
   * The main branch where the version should be published using the workflow.
   * This specifies the primary branch for version deployment.
   * Defaults to `master`
   */
  mainBranch?: string
}
