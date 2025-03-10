import { getFolderName, getRelativePath } from 'modules/helpers/paths.ts'
import { ZNX_STRUCT } from 'modules/helpers/zanix/folders/mod.ts'

export const linterBaseRules = [
  'eqeqeq',
  'default-param-last',
  'camelcase',
  'no-await-in-loop',
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

/**
 * Generates a hash string for a given Zanix project name.
 *
 * @param name - The full project name, potentially in the form '@proyect/name'.
 * @returns A lowercase hash string
 */
export const generateZanixHash = (name: string): string => {
  const [[orgInitial, ...orgLetters], projectName] = name.replace('@', '').split('/')

  const projectInitials = projectName
    ? projectName.split('-').map((word) => word[0]).join('')
    : orgInitial

  let hashCode = 0
  for (let i = 0; i < name.length; i++) {
    hashCode += name.charCodeAt(i)
  }

  const hash = Math.abs(hashCode % 1000).toString()
  const result = `${orgInitial}${projectInitials}${hash}`.toLowerCase()

  return result.padEnd(6, ...orgLetters)
}

/**
 * Generate imports or alias for zanix project structure
 * @param folders - Record folder names
 */
export function generateImports(
  // deno-lint-ignore no-explicit-any
  folders: Record<string, any>,
) {
  const imports: Record<string, string> = {}

  Object.keys(folders.subfolders).forEach((key) => {
    const folder = folders.subfolders[key]
    if (!folder) return
    const name = folder.NAME || getFolderName(folder.FOLDER)
    if (name === ZNX_STRUCT.subfolders.src.subfolders.tests.NAME) return
    imports[`${name}/`] = getRelativePath(folder.FOLDER)
  })

  return imports
}
