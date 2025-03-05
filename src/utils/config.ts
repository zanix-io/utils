import { parse } from 'https://deno.land/std@0.224.0/jsonc/mod.ts'
import { Config } from 'typings/config.ts'
import { getConfigDir } from './paths.ts'

/** Define a base `deno` configuration file */
const baseConfig = (): Config => {
  const baseRules = [
    'eqeqeq',
    'default-param-last',
    'camelcase',
    'no-await-in-loop',
    'no-console',
    'no-const-assign',
    'no-eval',
    'no-inferrable-types',
    'no-non-null-asserted-optional-chain',
    'no-non-null-assertion',
    'no-self-compare',
    'no-sync-fn-in-async-fn',
    'no-throw-literal',
    'no-useless-rename',
  ]

  return {
    compilerOptions: {
      strict: true,
      noImplicitAny: true,
    },
    lint: {
      rules: {
        tags: ['recommended'],
        include: baseRules,
      },
      exclude: ['znx/'],
      plugins: [
        './src/linter/plugins/zanix/mod.ts',
      ],
      report: 'pretty',
    },
    fmt: {
      exclude: ['znx/'],
      proseWrap: 'always',
      indentWidth: 2,
      singleQuote: true,
      lineWidth: 100,
      useTabs: false,
      semiColons: false,
    },
    imports: {
      'linter/': './src/linter/',
      'utils/': './src/utils/',
    },
  }
}

/** Reads and parses the `deno` configuration file */
export const readConfig = () => {
  const configPath = getConfigDir()

  if (!configPath) {
    throw new Error(`Configuration file not found: ${configPath}`)
  }

  const content = Deno.readTextFileSync(configPath)
  return parse(content) as Config
}

/** Formats and writes JSON content back to `deno` configuration file */
export const writeConfig = async (config: Config = baseConfig()): Promise<void> => {
  const configPath = getConfigDir()
  const formattedContent = JSON.stringify(config, null, 2)
  await Deno.writeTextFile(configPath || 'deno.jsonc', formattedContent)
}
