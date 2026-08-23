// Regression fixture for the errors↔logger dependency-inversion fix: `modules/errors/main.ts`
// used to `import logger from 'modules/logger/mod.ts'` directly, closing a real import cycle back
// into `modules/logger/mod.ts` (see that module's own `Logger extends LoggerMainClass` doc — the
// exact hazard `check-cycles` flags). The fix replaces that direct import with
// `registerLogSink`/`logSink`: `modules/logger/mod.ts` registers itself as `errors/main.ts`'s log
// sink only after its own default `logger` instance is fully constructed.
//
// This fixture proves two things in a REAL, fresh module graph (a subprocess, not the shared
// test-runner process every other test in this suite runs inside) — the same style already used
// by `__fixtures__/import-logger.ts` for a different eager-side-effect bug:
//  1. The graph still evaluates and an error still constructs without throwing.
//  2. The sink is genuinely CONNECTED by the time an error is actually thrown with
//     `shouldLog: true` — not just "doesn't crash", which alone wouldn't catch a silently
//     disconnected sink (the `logSink?.(...)` optional chaining means a disconnected sink fails
//     silently, not loudly, so a crash-only check could pass while logging is actually broken).
//
// Import order is deliberately `errors` before `logger` — the direction `errors/main.ts`'s own
// former direct import used to force — to prove the fix doesn't depend on either module happening
// to be imported first.
import { HttpError } from '../../../modules/errors/main.ts'
import '../../../modules/logger/mod.ts'

const captured: unknown[][] = []
const originalError = console.error
console.error = (...args: unknown[]) => {
  captured.push(args)
}

try {
  new HttpError('INTERNAL_SERVER_ERROR', {
    message: 'fresh-graph-log-sink-check',
    shouldLog: true,
  })
} finally {
  console.error = originalError
}

const loggedToConsole = captured.some((args) =>
  args.some((arg) => typeof arg === 'string' && arg.includes('fresh-graph-log-sink-check'))
)

// deno-lint-ignore deno-zanix-plugin/no-znx-console
console.log(loggedToConsole ? 'LOG_SINK_CONNECTED' : 'LOG_SINK_NOT_CONNECTED')
