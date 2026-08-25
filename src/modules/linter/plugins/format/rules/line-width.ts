import { linterMessageFormat } from 'modules/linter/commons/message.ts'
import { Line } from 'modules/linter/commons/visitors.ts'
import regex, { COMMENT_REGEX, ENCLOSED_STRING_REGEX } from 'utils/regex.ts'

// Same pattern as the publicly exported `ENCLOSED_STRING_REGEX`, just with the `g` flag added
// locally — this rule needs to replace EVERY string literal on a line (a line can carry more than
// one), not just the first `.replace()` match a non-global regex stops at. Built from `.source`
// rather than duplicating the pattern, so the two can never drift out of sync with each other.
const ENCLOSED_STRING_GLOBAL_REGEX = new RegExp(ENCLOSED_STRING_REGEX.source, 'g')

// A fixed, short stand-in for ANY string literal's real content — deliberately not the empty
// string. Swapping every string literal on a line for this placeholder (rather than deleting it
// outright) measures whether the surrounding CODE alone already exceeds the budget: a line whose
// only excess comes from a long descriptive string (a `Deno.test('...')` name, a log message)
// collapses under maxLineWidth once placeholder'd and is exempt; a line with genuinely long CODE
// (a long call, a long chain) stays over budget even with every string shortened, and still
// fails. Length 3, no significance to the exact characters beyond "short and fixed."
const STRING_PLACEHOLDER = '...'

/**
 * `Deno lint` rule to enforce a maximum line width limit in the code.
 *
 * This rule ensures that no line exceeds a certain maximum width (default is 100 characters).
 * Limiting line length enhances code readability and helps maintain a consistent code style.
 *
 * Deliberately not redundant with `deno fmt`: `deno fmt` already wraps any line whose length
 * comes from genuinely reformattable code (a long call's arguments, a long member-access chain)
 * — this rule can only ever see what `deno fmt` declines to touch, since the shared pre-commit
 * hook runs `deno fmt` immediately before `deno lint` in the same pass. What's left, by
 * construction, is a line whose length comes from content `fmt` correctly never rewrites: a
 * string literal, a comment, an import specifier. This rule's own string-literal exception
 * measures the line with every string's content swapped for a short placeholder first (see
 * `STRING_PLACEHOLDER`), so a line stays exempt only when the CODE around the string(s) — not the
 * string content itself — fits the budget.
 *
 * If a line exceeds the maximum allowed width and fails the validation, the rule will report an error message:
 *
 *  `❌ The line exceeds the maximum allowed width of [maxLineWidth] characters.`
 */
const rules: Record<string, Deno.lint.Rule> = {
  'line-width': {
    create(context) {
      const maxLineWidth = 100

      if (!maxLineWidth) return {}

      return Line(
        context,
        (
          { lineLength: baseLenght, lineStart, lineEnd, line, lines, index },
        ) => {
          const cleanLine = line.replace(COMMENT_REGEX, '').trim()
          const lineLength = cleanLine.length
          const prevLine = (lines[index - 1] || '').trim()
          const nextLine = (lines[index + 1] || '').trim()
          // Every string literal's real content swapped for a short, fixed placeholder — NOT
          // deleted outright — so this measures the surrounding CODE budget on its own. A line
          // whose only excess comes from a long string (a `Deno.test('...')` name, a log message)
          // collapses under `maxLineWidth` here and is exempt below; a line with genuinely long
          // code stays over budget even with every string shortened, and still gets reported.
          const codeOnlyLength =
            cleanLine.replace(ENCLOSED_STRING_GLOBAL_REGEX, STRING_PLACEHOLDER).length

          const exceptions = lineLength <= maxLineWidth ||
            cleanLine.startsWith('import ') ||
            codeOnlyLength <= maxLineWidth ||
            regex.BASE_LINE_COMMENT_REGEX.test(cleanLine) ||
            regex.BASE_LINE_COMMENT_REGEX.test(prevLine) &&
              (nextLine.endsWith('*/') && !COMMENT_REGEX.test(prevLine) ||
                nextLine.startsWith('*')) ||
            cleanLine.startsWith('return') || cleanLine.startsWith('`')

          if (exceptions) return

          context.report({
            node: {
              range: [lineStart + baseLenght - lineLength, lineEnd],
              type: 'Program',
            } as Deno.lint.Node,
            message: linterMessageFormat(
              `The line exceeds the maximum allowed width of ${maxLineWidth} characters.`,
            ),
            hint: 'Consider reviewing the formatting plugin.',
          })
        },
      )
    },
  },
}

export default rules
