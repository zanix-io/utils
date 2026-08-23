// deno-coverage-ignore-file

// Regression fixture for the eager-`readConfig()`-on-import bug: `modules/logger/mod.ts` creates
// its default `Logger` instance at module load time, and until this fix `Logger`'s constructor
// (via `setGlobalZnx`/`baseSaveData`) synchronously called `readConfig()` right then — so merely
// IMPORTING the logger required `allow-read` and touched disk, before any log was ever saved or
// `Znx.config` was ever actually read. Run from a `cwd` that HAS a real `deno.json` (so
// `readConfig()` doesn't short-circuit before ever reaching `Deno.readTextFileSync` — a config-
// less `cwd` throws earlier than that call either way, and wouldn't distinguish the two).
let called = false
const original = Deno.readTextFileSync
Deno.readTextFileSync = ((...args: Parameters<typeof original>) => {
  called = true
  return original(...args)
}) as typeof Deno.readTextFileSync

await import('../../../modules/logger/mod.ts')

// deno-lint-ignore deno-zanix-plugin/no-znx-console
console.log(called ? 'READ_TEXT_FILE_SYNC_CALLED' : 'READ_TEXT_FILE_SYNC_NOT_CALLED')
