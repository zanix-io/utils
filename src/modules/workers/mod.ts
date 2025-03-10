/**
 *  ______               _
 * |___  /              (_)
 *    / /   __ _  _ __   _ __  __
 *   / /   / _` || '_ \ | |\ \/ /
 * ./ /___| (_| || | | || | >  <
 * \_____/ \__,_||_| |_||_|/_/\_\
 */

/**
 * @module zanixWorkers
 *
 * This module provides utilities for managing Web Workers using Deno Workers.
 * It includes the `TaskerManager` class, which facilitates the execution of tasks
 * in a separate thread using Deno's Worker API.
 */

export * from 'modules/workers/tasker.ts'
