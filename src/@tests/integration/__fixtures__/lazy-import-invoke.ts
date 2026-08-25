// deno-coverage-ignore-file

// Companion fixture to `lazy-import-build-only.ts` — same wrapper, same real npm package, but
// actually INVOKED this time. Run from a fresh `cwd` (never the same one `lazy-import-build-only.ts`
// ran against) with its own real `deno.json` declaring `"nodeModulesDir": "auto"`. Proves the other
// half of `lazyFunction`'s contract: the real package DOES materialize into `node_modules`, but
// only once the returned wrapper is genuinely called, not before.
import { lazyFunction } from '../../../utils/lazy-import.ts'

type LeftPad = (input: string, length: number, char: string) => string

const wrapper = lazyFunction<LeftPad>('npm:left-pad@1.3.0', 'default')
const result = await wrapper('1', 3, '0')

// deno-lint-ignore deno-zanix-plugin/no-znx-console
console.log(`INVOKED_RESULT:${result}`)
