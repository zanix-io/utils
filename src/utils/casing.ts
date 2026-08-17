import { capitalize } from 'utils/encoders.ts'

/**
 * Converts a string (camelCase, PascalCase, snake_case, spaced, or already kebab-case) into
 * kebab-case, matching the folder-naming convention used across Zanix project scaffolding
 * (e.g. `grant-access`, `netting-opportunities`).
 *
 * @category helpers
 */
export function toKebabCase(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .split('-')
    .filter(Boolean)
    .join('-')
}

/**
 * Converts a string (kebab-case, snake_case, spaced, or camelCase) into PascalCase, matching the
 * class-naming convention used across Zanix generated code (e.g. `grant-access` -> `GrantAccess`).
 *
 * @category helpers
 */
export function toPascalCase(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => capitalize(word.toLowerCase()))
    .join('')
}
