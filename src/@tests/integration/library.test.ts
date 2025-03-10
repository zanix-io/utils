import { assertExists } from '@std/assert/assert-exists'

Deno.test('test library main module', async () => {
  const utils = await import('jsr:@zanix/utils')

  assertExists(utils.helpers)
  assertExists(utils.constants)
  assertExists(utils.regex)
  assertExists(utils.testing)
  assertExists(utils.workers)
  assertExists(!utils['logger' as never])
})

Deno.test('test library helpers module', async () => {
  const helpers = await import('jsr:@zanix/utils/helpers')

  assertExists(helpers)
})

Deno.test('test library constants module', async () => {
  const constants = await import('jsr:@zanix/utils/constants')

  assertExists(constants.default)
})

Deno.test('test library regex module', async () => {
  const regex = await import('jsr:@zanix/utils/regex')

  assertExists(regex.default)
})

Deno.test('validates library testing module', async () => {
  const testing = await import('jsr:@zanix/utils/testing')

  assertExists(testing)
})

Deno.test('validates library workers module', async () => {
  const workers = await import('jsr:@zanix/utils/workers')

  assertExists(workers)
})

Deno.test('validates library fmt lint plugin', async () => {
  const fmt = await import('jsr:@zanix/utils/linter/deno-fmt-plugin')

  assertExists(fmt.default.name)
  assertExists(fmt.default.rules)
})

Deno.test('validates library lint plugin', async () => {
  const std = await import('jsr:@zanix/utils/linter/deno-std-plugin')
  const zanix = await import('jsr:@zanix/utils/linter/deno-zanix-plugin')
  const test = await import('jsr:@zanix/utils/linter/deno-test-plugin')

  assertExists(std.default.name)
  assertExists(std.default.rules)

  assertExists(zanix.default.name)
  assertExists(zanix.default.rules)

  assertExists(test.default.name)
  assertExists(test.default.rules)
})
