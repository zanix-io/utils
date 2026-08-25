// deno-lint-ignore-file no-explicit-any

/**
 * Lazy resolution for a genuinely CONDITIONAL/OPTIONAL dependency — a package a caller only needs
 * some of the time (e.g. one queue/database/auth backend among several available), not a hard
 * dependency merely dressed up as a dynamic `import()` for style. Every helper here defers
 * `import(specifier)` until the wrapper it returns is actually invoked, never at import time —
 * so a module that only ever builds the wrapper (never calls it) never touches the target module
 * at all.
 *
 * This is the runtime half of the ecosystem's lazy-dependency convention: under Deno's
 * `nodeModulesDir: "auto"`, a project materializes (`npm install`-style) every `npm:` package
 * declared in its own `deno.json` `imports` map, regardless of whether reachable code actually
 * imports it — a bare alias declared there is, on its own, already enough to trigger that
 * materialization. `specifier` here must therefore be a fully-qualified `jsr:`/`npm:` string,
 * resolved OUTSIDE the caller's own `imports` map (never a bare alias) — confirmed empirically
 * against a real, controlled build, not theoretical. See `@zanix/app`'s own
 * `modules/runtime/lazy-specifiers.ts` for a real, in-production example of a package keeping its
 * conditional dependencies' specifiers out of `imports` for exactly this reason.
 *
 * A real `import type` from the SAME package is not automatically safe from the same
 * materialization either: if the package's own value-level exports pull in real `npm:`
 * dependencies, resolving that type still needs the package's own module graph — under
 * `nodeModulesDir: "auto"` that installs those `npm:` dependencies just to resolve the type, even
 * though no VALUE from the package is ever imported. The only real way around that is a narrow
 * subpath exposing just the types actually needed, kept free of the package's own npm-backed
 * value exports — these three helpers only address the value/runtime side of the problem, not
 * that separate type-level one.
 *
 * @module
 */

/**
 * Lazily resolves and calls a real exported FUNCTION from `specifier`, without ever importing the
 * target module until the wrapper this returns is actually invoked. `specifier` must be a
 * fully-qualified `jsr:`/`npm:` string — see this module's own doc for why a bare alias declared
 * in the caller's `deno.json` `imports` map defeats the point.
 *
 * @param specifier Fully-qualified module specifier, imported on first (and every) call.
 * @param exportName Name of the exported function to call on the resolved module.
 * @returns A function accepting `Fn`'s own parameters, resolving to `Fn`'s own (awaited) result.
 *
 * @example
 * const sendEmail = lazyFunction<typeof import('npm:some-mailer').send>(
 *   'npm:some-mailer@2.0.0',
 *   'send',
 * )
 * // `some-mailer` is only ever imported the first time `sendEmail` is actually called
 * await sendEmail({ to: 'user@example.com' })
 *
 * @category helpers
 */
export function lazyFunction<Fn extends (...args: any[]) => any>(
  specifier: string,
  exportName: string,
): (...args: Parameters<Fn>) => Promise<Awaited<ReturnType<Fn>>> {
  return async (...args: Parameters<Fn>) => {
    const targetModule = await import(specifier)
    return targetModule[exportName](...args)
  }
}

/**
 * Lazily resolves a real exported CLASS from `specifier` and constructs an instance of it,
 * without ever importing the target module until the factory this returns is actually invoked.
 * There's no way to lazily `new` something only available after an `await`, so this returns an
 * async FACTORY function instead of the class itself — call it wherever `new RealClass(...)`
 * would otherwise go. `specifier` must be a fully-qualified `jsr:`/`npm:` string — see this
 * module's own doc for why a bare alias declared in the caller's `deno.json` `imports` map
 * defeats the point.
 *
 * @param specifier Fully-qualified module specifier, imported on first (and every) call.
 * @param exportName Name of the exported class to construct from the resolved module.
 * @returns A function accepting `Cls`'s own constructor parameters, resolving to a new instance.
 *
 * @example
 * const createConnection = lazyClass<typeof import('npm:some-driver').Connection>(
 *   'npm:some-driver@1.4.0',
 *   'Connection',
 * )
 * // `some-driver` is only ever imported the first time `createConnection` is actually called
 * const connection = await createConnection({ url: 'mongodb://localhost' })
 *
 * @category helpers
 */
export function lazyClass<Cls extends new (...args: any[]) => any>(
  specifier: string,
  exportName: string,
): (...args: ConstructorParameters<Cls>) => Promise<InstanceType<Cls>> {
  return async (...args: ConstructorParameters<Cls>) => {
    const targetModule = await import(specifier)
    const RealClass = targetModule[exportName]
    return new RealClass(...args)
  }
}

/**
 * Lazily resolves a plain exported VALUE/constant from `specifier`, without ever importing the
 * target module until the thunk this returns is actually invoked. Deno's own module cache
 * deduplicates repeated `import()` calls to the same resolved specifier — a real ECMAScript spec
 * guarantee, not a Deno-specific behavior — so this helper adds no caching of its own; calling the
 * returned thunk more than once is always safe and cheap after the first real resolution.
 * `specifier` must be a fully-qualified `jsr:`/`npm:` string — see this module's own doc for why a
 * bare alias declared in the caller's `deno.json` `imports` map defeats the point.
 *
 * @param specifier Fully-qualified module specifier, imported on first (and every) call.
 * @param exportName Name of the exported value to resolve from the resolved module.
 * @returns A thunk resolving to the exported value.
 *
 * @example
 * const getDefaultRegion = lazyValue<string>('npm:some-config-pkg@1.0.0', 'DEFAULT_REGION')
 * // `some-config-pkg` is only ever imported the first time `getDefaultRegion` is actually called
 * await getDefaultRegion() // e.g. 'us-east-1'
 *
 * @category helpers
 */
export function lazyValue<T>(
  specifier: string,
  exportName: string,
): () => Promise<T> {
  return async () => {
    const targetModule = await import(specifier)
    return targetModule[exportName] as T
  }
}
