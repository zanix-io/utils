/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

/**
 * Testing utilities: `mockWrap` rewrites a function's source to inject mock dependencies
 * (globals, imports) without touching the original module. `resetConfig` clears `readConfig()`'s
 * memoized result, for a test that needs to control what it resolves to.
 *
 * @module zanixTesting
 */

export * from './mocks.ts'
export { resetConfig } from 'modules/helpers/config.ts'
