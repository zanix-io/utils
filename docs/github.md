## GitHub automation

Scaffolding for `.github` hooks, workflows, and the base `.gitignore`. Each individual helper accepts a `baseFolder`/`baseRoot` pair (`BaseGithubHelperOptions`), but **there is no single shared default for `baseFolder`** — every helper defaults it differently depending on what it creates (hooks default to `.github/hooks`, the publish workflow defaults to `.github/workflows`). `prepareGithub` is the orchestrator that wires all of them together in one call.

| Symbol                        | Signature                                                                   | Description                                                                                                                                                                                                                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PrepareGithubOptions` (type) | `{ legacyHooks?, usePrecommit?, publishWorkflow?, gitIgnoreBase? }`         | Options accepted by `prepareGithub`.                                                                                                                                                                                                                                                                                                    |
| `prepareGithub`               | `(options?: PrepareGithubOptions & { root?: string }): Promise<boolean[]>`  | Initializes the git repo if needed, then creates the publish workflow, the base `.gitignore`, the `pre-commit` and `pre-push` hooks, and — when `usePrecommit` is truthy — the `pre-commit` framework YAML. Returns the boolean creation result of each step, in that order.                                                            |
| `createGitWorkflow`           | `(options?: WorkflowOptions): Promise<boolean>`                             | Creates the `publish.yml` GitHub Actions workflow. Only generates a file for `projectType: 'library'` (the default); for other project types it logs a warning and returns `false` without writing anything. Defaults `baseFolder` to `.github/workflows` and `mainBranch` to `master`.                                                 |
| `createIgnoreBaseFile`        | `(options?: Omit<BaseGithubHelperOptions, 'baseFolder'>): Promise<boolean>` | Writes a base `.gitignore` file at the project root (or `baseRoot`).                                                                                                                                                                                                                                                                    |
| `createPreCommitHook`         | `(options: PreCommitHookOptions): Promise<boolean>`                         | Writes a `pre-commit` git hook that runs `deno fmt` and `deno lint` on staged files, and symlinks it into `.git/hooks` (unless `createLink: false`). Defaults `baseFolder` to `.github/hooks`. `filePatterns.lint` defaults to `['ts', 'tsx', 'js', 'jsx']` and `filePatterns.fmt` defaults to that same list plus `'md'` and `'json'`. |
| `createPrePushHook`           | `(options?: HookOptions): Promise<boolean>`                                 | Writes a `pre-push` git hook that runs `deno test`, and symlinks it into `.git/hooks`. Defaults `baseFolder` to `.github/hooks`.                                                                                                                                                                                                        |

```typescript
import { prepareGithub } from 'jsr:@zanix/utils@[version]/helpers'

// Sets up the publish workflow, .gitignore, and legacy pre-commit/pre-push hooks
const results = await prepareGithub()

// Using the `pre-commit` framework instead of the legacy hook, plus a custom main branch
await prepareGithub({
  usePrecommit: true,
  publishWorkflow: { mainBranch: 'main' },
})
```

```typescript
import { createPreCommitHook, createPrePushHook } from 'jsr:@zanix/utils@[version]/helpers'

await createPreCommitHook({
  filePatterns: { lint: ['ts', 'tsx'], fmt: ['ts', 'tsx', 'md'] },
})

await createPrePushHook({ createLink: false })
```

```typescript
import { createGitWorkflow, createIgnoreBaseFile } from 'jsr:@zanix/utils@[version]/helpers'

await createGitWorkflow({ mainBranch: 'main', projectType: 'library' })
await createIgnoreBaseFile()
```
