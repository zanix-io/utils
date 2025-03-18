import type { FormatAvailableFiles, LinterAvailableFiles } from 'typings/files.ts'
import type { ZanixProjects } from 'typings/zanix.ts'

export type BaseGithubHelperOptions = {
  /** The folder where the hook should be created. Defaults to '.github/hooks' */
  baseFolder?: string
  /** The current directory */
  baseRoot?: string
}
export type HookOptions = BaseGithubHelperOptions & {
  /**  A flag indicating whether a symbolic link should be created in the GitHub hooks directory. */
  createLink?: boolean
}

export type PreCommitHookOptions = HookOptions & {
  /**
   * An array of file extensions to be linted.
   * @deprecated Use filePatterns instead.
   */
  fileType?: LinterAvailableFiles[]
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

export type WorkflowOptions = BaseGithubHelperOptions & {
  /**
   * Defines the `ZanixProjects` type, which is a reference to ZnxProjects.
   */
  projectType?: ZanixProjects
  /**
   * The main branch where the version should be published using the workflow.
   * This specifies the primary branch for version deployment.
   * Defaults to `master`
   */
  mainBranch?: string
}
