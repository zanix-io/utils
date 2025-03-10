/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

/**
 * @module zanixHelpers
 *
 * This module provides utilities and functions for general tasks.
 *
 * Includes tools for file manipulation, string handling, etc.
 *
 * @example
 *
 * ```typescript
 * import { compileAndObfuscate } from 'jsr:@zanix/utils@[version]/helpers'
 * await compileAndObfuscate() // esbuild helper
 * ```
 */

export * from 'modules/helpers/zanix/namespace.ts'
export * from 'utils/identifiers.ts'
export * from 'utils/dates.ts'
export * from './zanix/projects.ts'
export * from './zanix/config/mod.ts'
export * from './paths.ts'
export * from './files.ts'
export * from './config.ts'
export * from './builder/mod.ts'
