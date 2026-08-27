// deno-coverage-ignore-file

// Regression fixture for https://github.com/zanix-io/utils/issues/18: `readModuleConfig`'s
// `file:` branch (`findLocalConfigPath`) walks up ancestor directories looking for the config
// file. Run with `--allow-read` scoped to this fixture's own directory only, the very next
// ancestor the walk checks is outside that grant — proving the resulting error is the real
// permission denial (`Deno.errors.NotCapable`/`PermissionDenied`), never the generic `NotFound`
// that used to surface once a swallowed permission error let the walk keep climbing all the way
// to the filesystem root.
import { readModuleConfig } from '../../../modules/helpers/config.ts'

try {
  await readModuleConfig(import.meta.url, false)
  // deno-lint-ignore deno-zanix-plugin/no-znx-console
  console.log('NO_ERROR_THROWN')
} catch (error) {
  if (error instanceof Deno.errors.NotCapable || error instanceof Deno.errors.PermissionDenied) {
    // deno-lint-ignore deno-zanix-plugin/no-znx-console
    console.log(`PERMISSION_ERROR:${error.constructor.name}`)
  } else if (error instanceof Deno.errors.NotFound) {
    // deno-lint-ignore deno-zanix-plugin/no-znx-console
    console.log('NOT_FOUND_ERROR')
  } else {
    // deno-lint-ignore deno-zanix-plugin/no-znx-console
    console.log(`OTHER_ERROR:${(error as Error)?.constructor?.name ?? String(error)}`)
  }
}
