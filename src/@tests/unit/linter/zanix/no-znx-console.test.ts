import { assertEquals } from '@std/assert'
import zanixPlugin from 'modules/linter/plugins/zanix/mod.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'
import { getTemporaryFolder } from 'modules/helpers/paths.ts'

const fileName = 'test.ts'

/**
 * Creates a fresh scratch project (its own `deno.json` plus a `sample.ts` path inside it) to
 * exercise the auto-fix's real upward config search — every case below needs its own project so
 * one test's `deno.json` (or lack of one) can never leak into another's.
 */
async function createScratchProject(imports?: Record<string, string>): Promise<string> {
  const dir = getTemporaryFolder(import.meta.url, 'no-znx-console-')
  if (imports) {
    await Deno.writeTextFile(
      `${dir}/deno.json`,
      JSON.stringify({ imports }),
    )
  }
  return `${dir}/sample.ts`
}

const consoleFixMessage = linterMessageFormat("Disallows the use of 'console'.")
const consoleFixHint =
  "Please use the Zanix 'logger' module instead for consistent and properly formatted logging."

Deno.test('no-znx-console plugin should report Zanix logger violations', () => {
  // Run the plugin on a test file with code that should violate the no-znx-console rule
  const diagnostics = Deno.lint.runPlugin(
    zanixPlugin,
    fileName,
    `console.log(0);
    console.error(0);
    console.info(0);
    console.debug(0);
    console.warn(0);`,
  )

  // Ensure there is exactly one diagnostic violation
  assertEquals(diagnostics.length, 5)

  // Verify the diagnostic contains the correct details
  const ranges = [
    [0, 14],
    [20, 36],
    [42, 57],
    [63, 79],
    [85, 100],
  ]

  diagnostics.forEach((diagnostic, index) => {
    assertEquals({ ...diagnostic }, {
      id: 'deno-zanix-plugin/no-znx-console',
      message: consoleFixMessage,
      hint: consoleFixHint,
      range: ranges[index],
      fix: [],
    })
  })
})

Deno.test(
  'no-znx-console auto-fix maps every known console method to its logger equivalent, inserting the import exactly once',
  async () => {
    const filename = await createScratchProject({
      '@zanix/logger': 'jsr:@zanix/utils@^3.0.0/logger',
    })

    const code = `console.log('a')\nconsole.error('b')\nconsole.info('c')\nconsole.warn('d')\n`
    try {
      const diagnostics = Deno.lint.runPlugin(zanixPlugin, filename, code)

      assertEquals(diagnostics.length, 4)

      // Only the FIRST violation's fix carries the import insertion.
      assertEquals(diagnostics[0].fix, [
        { range: [0, 11], text: 'logger.debug' },
        { range: [0, 0], text: `import logger from '@zanix/logger'\n` },
      ])
      assertEquals(diagnostics[1].fix?.length, 1)
      assertEquals((diagnostics[1].fix as { text: string }[])[0].text, 'logger.error')
      assertEquals(diagnostics[2].fix?.length, 1)
      assertEquals((diagnostics[2].fix as { text: string }[])[0].text, 'logger.info')
      assertEquals(diagnostics[3].fix?.length, 1)
      assertEquals((diagnostics[3].fix as { text: string }[])[0].text, 'logger.warn')
    } finally {
      await Deno.remove(filename.replace(/\/sample\.ts$/, ''), { recursive: true })
    }
  },
)

Deno.test(
  'no-znx-console auto-fix resolves the real alias from the target project, never a hardcoded one (space-ui convention)',
  async () => {
    const filename = await createScratchProject({
      '@zanix/utils/logger': 'jsr:@zanix/utils@^3.0.0/logger',
    })

    try {
      const diagnostics = Deno.lint.runPlugin(zanixPlugin, filename, `console.log('a')`)

      assertEquals(diagnostics[0].fix, [
        { range: [0, 11], text: 'logger.debug' },
        { range: [0, 0], text: `import logger from '@zanix/utils/logger'\n` },
      ])
    } finally {
      await Deno.remove(filename.replace(/\/sample\.ts$/, ''), { recursive: true })
    }
  },
)

Deno.test(
  'no-znx-console auto-fix reuses an existing logger import instead of inserting a second one',
  async () => {
    const filename = await createScratchProject({
      '@zanix/logger': 'jsr:@zanix/utils@^3.0.0/logger',
    })

    const code = `import myLogger from '@zanix/logger'\n\nconsole.log('a')\nconsole.error('b')\n`
    try {
      const diagnostics = Deno.lint.runPlugin(zanixPlugin, filename, code)

      assertEquals(diagnostics.length, 2)
      // Both fixes only rewrite their own call site — neither inserts an import.
      diagnostics.forEach((diagnostic) => {
        assertEquals(diagnostic.fix?.length, 1)
        assertEquals((diagnostic.fix as { text: string }[])[0].text.startsWith('myLogger.'), true)
      })
    } finally {
      await Deno.remove(filename.replace(/\/sample\.ts$/, ''), { recursive: true })
    }
  },
)

Deno.test(
  'no-znx-console auto-fix is skipped (report-only) when the project has no resolvable @zanix/utils logger alias',
  async () => {
    // A real deno.json exists, but it doesn't declare any alias for @zanix/utils's /logger subpath.
    const filename = await createScratchProject({ '@std/path': 'jsr:@std/path@0.224' })

    try {
      const diagnostics = Deno.lint.runPlugin(
        zanixPlugin,
        filename,
        `console.log('a')\nconsole.error('b')`,
      )

      assertEquals(diagnostics.length, 2)
      diagnostics.forEach((diagnostic) => assertEquals(diagnostic.fix, []))
    } finally {
      await Deno.remove(filename.replace(/\/sample\.ts$/, ''), { recursive: true })
    }
  },
)

Deno.test(
  'no-znx-console auto-fix is skipped when no deno.json(c) exists at all above the linted file',
  async () => {
    const filename = await createScratchProject()

    try {
      const diagnostics = Deno.lint.runPlugin(zanixPlugin, filename, `console.log('a')`)
      assertEquals(diagnostics[0].fix, [])
    } finally {
      await Deno.remove(filename.replace(/\/sample\.ts$/, ''), { recursive: true })
    }
  },
)

Deno.test(
  'no-znx-console auto-fix does not offer a fix for a console method with no safe 1:1 logger mapping',
  async () => {
    const filename = await createScratchProject({
      '@zanix/logger': 'jsr:@zanix/utils@^3.0.0/logger',
    })

    try {
      const diagnostics = Deno.lint.runPlugin(zanixPlugin, filename, `console.table(['a'])`)

      assertEquals(diagnostics.length, 1)
      assertEquals(diagnostics[0].fix, []) // still reported, never fixed
    } finally {
      await Deno.remove(filename.replace(/\/sample\.ts$/, ''), { recursive: true })
    }
  },
)

Deno.test(
  'no-znx-console auto-fix does not offer a fix for computed console member access',
  async () => {
    const filename = await createScratchProject({
      '@zanix/logger': 'jsr:@zanix/utils@^3.0.0/logger',
    })

    try {
      const diagnostics = Deno.lint.runPlugin(zanixPlugin, filename, `console['log']('a')`)

      assertEquals(diagnostics.length, 1)
      assertEquals(diagnostics[0].fix, [])
    } finally {
      await Deno.remove(filename.replace(/\/sample\.ts$/, ''), { recursive: true })
    }
  },
)

Deno.test(
  'no-znx-console auto-fix inserts the import after a leading directive-prologue flag, preserving its position-0 requirement',
  async () => {
    const filename = await createScratchProject({
      '@zanix/logger': 'jsr:@zanix/utils@^3.0.0/logger',
    })

    try {
      const diagnostics = Deno.lint.runPlugin(
        zanixPlugin,
        filename,
        `'use comet'\n\nconsole.log('a')\n`,
      )

      const importFix = diagnostics[0].fix?.find((fix) => fix.text?.startsWith('import'))
      // Inserted at index 13 (right after `'use comet'\n\n`), not at 0 — otherwise the directive
      // would no longer be at position 0 and `use-znx-flags` would misfire on the next lint pass.
      assertEquals(importFix, { range: [13, 13], text: `import logger from '@zanix/logger'\n` })
    } finally {
      await Deno.remove(filename.replace(/\/sample\.ts$/, ''), { recursive: true })
    }
  },
)
