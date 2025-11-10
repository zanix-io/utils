import type * as types from '@zanix/utils/types'

import { assertExists } from '@std/assert/assert-exists'
import { assert } from '@std/assert'

Deno.test('test library main module', async () => {
  const utils = await import(`jsr:@zanix/utils`)

  assert(utils.constants['default' as never] === undefined)
  assertExists(utils.constants)
  assert(utils.regex['default' as never] === undefined)
  assertExists(utils.regex)
  assertExists(utils.validator)
  assertExists(utils.HttpError)
  assertExists(utils.WorkerManager)
  // Some utils
  assertExists(utils.createPrePushHook)
  assertExists(utils.compileAndObfuscate)
  assertExists(utils.createIgnoreBaseFile)
  assertExists(utils.getTemporaryFolder)

  assert(!utils['logger' as never])
})

Deno.test('test library constants module', async () => {
  const constants = await import(`jsr:@zanix/utils/constants`)

  assertExists(constants.CONFIG_FILE)
  assertExists(constants.default)
})

Deno.test('test library types module', () => {
  const type: types.HttpErrors = {} as never
  assertExists(type)
})

Deno.test('test library regex module', async () => {
  const regex = await import(`jsr:@zanix/utils/regex`)

  assertExists(regex.commentRegex)
  assertExists(regex.default)
})

Deno.test('test library errors module', async () => {
  const errors = await import(`jsr:@zanix/utils/errors`)

  assertExists(errors.httpStates)
  assertExists(errors.serializeError)
  assertExists(errors.serializeMultipleErrors)
  assertExists(errors.HttpError)
})

Deno.test('validates library logger module', async () => {
  const logger = await import(`jsr:@zanix/utils/logger`)

  assertExists(logger.default)
  assertExists(logger.Logger)
})

Deno.test('validates library workers module', async () => {
  const workers = await import(`jsr:@zanix/utils/workers`)

  assertExists(workers.WorkerManager)
})

Deno.test('validates library testing module', async () => {
  const testing = await import(`jsr:@zanix/utils/testing`)

  assertExists(testing)
})

Deno.test('test library helpers module', async () => {
  const helpers = await import(`jsr:@zanix/utils/helpers`)

  assertExists(helpers)
})

Deno.test('test library validations module', async () => {
  const validation = await import(`jsr:@zanix/utils/validator`)

  assertExists(validation)
})

Deno.test('validates library fmt lint plugin', async () => {
  const fmt = await import(`jsr:@zanix/utils/linter/deno-fmt-plugin`)

  assertExists(fmt.default.name)
  assertExists(fmt.default.rules)
})

Deno.test('validates library lint plugin', async () => {
  const std = await import(`jsr:@zanix/utils/linter/deno-std-plugin`)
  const zanix = await import(`jsr:@zanix/utils/linter/deno-zanix-plugin`)
  const test = await import(`jsr:@zanix/utils/linter/deno-test-plugin`)

  assertExists(std.default.name)
  assertExists(std.default.rules)

  assertExists(zanix.default.name)
  assertExists(zanix.default.rules)

  assertExists(test.default.name)
  assertExists(test.default.rules)
})
