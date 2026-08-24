import type { WorkerEntry } from 'typings/workers.ts'

/**
 * Spawns the real worker every `WorkerManager` instance's pool is built from.
 *
 * The worker's entry module is `./worker-entry.ts`, never this file — this file is safe to import
 * statically from the host process (as `manager.ts` does) precisely because it has no top-level
 * side effects of its own. `./worker-entry.ts` installs global handlers (`self.onerror`,
 * `unhandledrejection`) that must only ever run inside the spawned Worker's own isolated realm; if
 * this file spawned the worker against itself (`import.meta.url`) instead, importing it here would
 * evaluate that same top-level code in the HOST process too, since a plain ESM import always runs
 * a module's top-level statements regardless of which of its exports are actually used.
 *
 * @param permissions Forwarded as-is to `Worker`'s own `deno.permissions` option — restricts what
 * this ONE worker can do (`net`/`read`/`write`/`env`/`run`/`ffi`/`sys`), independent of every other
 * worker in the same or a different pool. Omit entirely (the default, unchanged behavior for every
 * existing caller) to inherit the host process's own full permission set, exactly as before this
 * parameter existed. A worker's permissions can never exceed its parent's own — Deno's own Worker
 * API enforces that, not this function.
 */
export const getWebProcessWorker = (
  permissions?: Deno.PermissionOptions,
): WorkerEntry => {
  const worker = new Worker(new URL('./worker-entry.ts', import.meta.url), {
    // The spread comes BEFORE `type` (never after) — the same runtime object either way, since
    // the spread only ever contributes a `deno` key, never `type`. The URL argument above is a
    // real `new URL(..., import.meta.url)` — exactly the `new Worker(new URL(...), options)`
    // shape Vite's own `worker-import-meta-url` plugin statically parses wherever a client bundle
    // reaches this module (e.g. `@zanix/space`'s client bundle, via `@zanix/logger`). That plugin
    // needs `type` to resolve to a literal, and refuses to parse an options object with a spread
    // AFTER `type` ("Expected object spread to be used before the definition of the type
    // property"), since it can no longer prove the spread won't overwrite it. Confirmed
    // empirically against a real Vite 8.2.2/rolldown build: this key order parses cleanly; `type`
    // before the spread does not.
    ...(permissions !== undefined ? { deno: { permissions } } : {}),
    type: 'module',
  })
  return { worker, status: 'free' }
}
