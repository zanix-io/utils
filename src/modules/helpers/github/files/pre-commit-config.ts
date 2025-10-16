import type { BaseGithubHelperOptions } from 'typings/github.ts'
import { createBaseFile } from './base.ts'
import logger from 'modules/logger/mod.ts'

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
export async function createPreCommitYaml(
  options: Omit<BaseGithubHelperOptions, 'baseFolder'> = {},
): Promise<boolean> {
  const response = createBaseFile({
    baseFile: 'pre-commit.yaml',
    filename: '.pre-commit-config.yaml',
    ...options,
  })

  // 1. pre-commit install
  const install = await new Deno.Command('pre-commit', {
    args: ['install'],
  }).output()

  if (!install.success) {
    logger.warn(
      'It seems pre-commit is not installed. Please install pre-commit and run the following commands: `pre-commit install` and `pre-commit autoupdate` to properly set up your environment.',
    )
  } else {
    // 2. pre-commit autoupdate
    await new Deno.Command('pre-commit', {
      args: ['autoupdate'],
    }).output()
  }

  return response
}
