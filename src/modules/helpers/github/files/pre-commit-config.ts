import type { BaseGithubHelperOptions } from 'typings/github.ts'
import { createBaseFile } from './base.ts'

/**
 * Sets up a `pre-commit-config.yaml` to to execute base hooks using pre-commit-framework.
 *
 * This function generates a pre-commit-config yaml file that runs main base hooks by default.
 *
 * @param options The create hook options.
 *   - `baseRoot`: The base root directory where the folder should be created.
 *
 * @category helpers
 */
export function createPreCommitYaml(
  options: Omit<BaseGithubHelperOptions, 'baseFolder'> = {},
): Promise<boolean> {
  return createBaseFile({
    baseFile: 'pre-commit.yaml',
    filename: '.pre-commit-config.yaml',
    ...options,
  })
}
