## Build

| Symbol                | Signature                                                                                      | Description                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `compileAndObfuscate` | `(options?: Partial<CompilerOptions>): void \| Promise<{ error?: unknown; message?: string }>` | Bundles a file with esbuild and optionally obfuscates the output with `javascript-obfuscator`. |

`options` accepts (all optional):

| Option       | Default                   | Description                                                                                        |
| ------------ | ------------------------- | -------------------------------------------------------------------------------------------------- |
| `inputFile`  | Zanix `mod.ts` path       | The source file to compile.                                                                        |
| `outputFile` | Zanix `.dist` bundle path | Where the compiled (and possibly obfuscated) file is written.                                      |
| `obfuscate`  | `false`                   | Whether to run the output through `javascript-obfuscator`.                                         |
| `useWorker`  | `false`                   | Whether to run the build inside a `WorkerManager` background worker instead of the current thread. |
| `minify`     | `true`                    | Whether esbuild minifies the output.                                                               |
| `bundle`     | `true`                    | Whether esbuild bundles all dependencies into a single file.                                       |
| `platform`   | `'neutral'`               | esbuild platform target (`'node' \| 'neutral' \| 'browser'`).                                      |
| `npm`        | `''`                      | Comma-separated list of npm packages to keep external (not bundled).                               |
| `plugins`    | `() => []`                | Extra esbuild plugins to include alongside the built-in Deno/npm loaders.                          |
| `callback`   | `() => {}`                | Invoked with `{ error?, message? }` once the build finishes (in both the direct and worker paths). |

This function requires `allow-read`, `allow-env`, `allow-write`, and `allow-run`.

```typescript
import { compileAndObfuscate } from 'jsr:@zanix/utils@[version]/helpers'

await compileAndObfuscate() // esbuild, using Zanix default input/output paths
```

```typescript
import { compileAndObfuscate } from 'jsr:@zanix/utils@[version]/helpers'

await compileAndObfuscate({
  inputFile: './src/mod.ts',
  outputFile: './.dist/mod.js',
  obfuscate: true,
  npm: 'esbuild,javascript-obfuscator',
  callback: ({ error, message }) => console.log(message ?? error),
})
```

```typescript
import { compileAndObfuscate } from 'jsr:@zanix/utils@[version]/helpers'

// Runs the build in a background worker instead of blocking the current thread
compileAndObfuscate({ useWorker: true, obfuscate: true })
```
