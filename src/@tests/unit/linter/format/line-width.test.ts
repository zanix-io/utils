import { assertEquals } from '@std/assert'
import formatPlugin from 'modules/linter/plugins/format/mod.ts'
import { linterMessageFormat } from 'modules/linter/commons/message.ts'

const fileName = 'test.ts'

Deno.test('line-width plugin still reports a violation when the CODE itself is too long', () => {
  // No string literal at all here — every character over budget is real code (a long call with
  // several long, real argument names), the exact case the placeholder-swap fix must NOT relax.
  const code =
    `someFunctionWithAVeryLongNameThatKeepsGoingAndGoingHere(argumentOne, argumentTwo, argumentThree, argumentFour)`

  const diagnostics = Deno.lint.runPlugin(formatPlugin, fileName, code)

  assertEquals(diagnostics.length, 1)
  assertEquals({ ...diagnostics[0] }, {
    id: 'deno-fmt-plugin/line-width',
    message: linterMessageFormat(
      'The line exceeds the maximum allowed width of 100 characters.',
    ),
    range: [0, code.length],
    hint: 'Consider reviewing the formatting plugin.',
    fix: [],
  })
})

Deno.test('line-width plugin does not report a Deno.test() call whose only excess is its own name string', () => {
  // The real, motivating case: `deno fmt` already declines to wrap this (a string literal can't
  // be safely reformatted without changing its value), so this rule used to be the only thing
  // that could still flag it — but the OLD heuristic (strip every string, require the REST of the
  // line to be nearly empty) didn't recognize this shape: `Deno.test(`, the trailing comma, and
  // `async () => {` survive the strip and pushed the "nearly empty" check over its own threshold,
  // even though the string is still the sole real cause of the overflow.
  const code =
    `Deno.test('lazyValue: repeated calls resolve the same value without re-importing (module cache dedup)', async () => {})`

  const diagnostics = Deno.lint.runPlugin(formatPlugin, fileName, code)

  assertEquals(diagnostics.length, 0)
})

Deno.test("line-width plugin does not report any line whose only excess is a string literal's own content", () => {
  // Same principle as the Deno.test() case above, generalized: it's the CODE around a string that
  // decides whether a line is exempt, not merely whether the whole line goes "nearly empty" once
  // stripped. `const oldStringAssignment = ;` (placeholder'd) is trivially short on its own, so
  // this is exempt too — a deliberate, intentional relaxation from this rule's own earlier
  // behavior (which used to report this exact line, since 11 leftover characters after stripping
  // the string didn't clear the old "< 2" near-empty threshold), not an oversight. See
  // `line-width.ts`'s own module doc for the full reasoning.
  const code =
    `const oldStringAssignment = 'This is a really really really long line that exceeds the maximum allowed width to testing';`

  const diagnostics = Deno.lint.runPlugin(formatPlugin, fileName, code)

  assertEquals(diagnostics.length, 0)
})
