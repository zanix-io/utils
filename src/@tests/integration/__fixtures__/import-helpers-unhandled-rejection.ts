// Regression fixture for https://github.com/zanix-io/utils/issues/10: importing anything from
// `modules/helpers/mod.ts` used to pull in `modules/workers/processor.ts` (via
// `utils/cron.ts` -> `modules/logger/mod.ts` -> `.../storage/main.ts` -> `modules/workers/mod.ts`
// -> `manager.ts`), whose top-level code installed `self.onerror`/`self.addEventListener(
// 'unhandledrejection', ...)` unconditionally — meant to run only inside a spawned Worker's own
// isolated realm, but actually running in whichever realm imports it, including the host process's
// own main thread. That handler called `event.preventDefault()` unconditionally, silently
// swallowing every unhandled promise rejection in the host process instead of letting Deno's
// default behavior (print the error, exit non-zero) run.
//
// `cleanRoute` itself does nothing worker-related — it's imported and never called, exactly like
// the issue's own repro, to prove the suppression comes from the import alone.
import { cleanRoute } from '../../../modules/helpers/mod.ts'

void cleanRoute

Promise.reject(new Error('boom'))
