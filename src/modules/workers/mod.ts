/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

/**
 * `WorkerManager` runs functions in a separate Web Worker thread instead of blocking the main
 * thread, with an internal pool of workers, task queueing, and timeout/error handling.
 *
 * @module zanixWorkers
 */

export * from './manager.ts'
