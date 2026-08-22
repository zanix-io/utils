import { linterMessageFormat } from 'modules/linter/commons/message.ts'
import { Line } from 'modules/linter/commons/visitors.ts'
import regex, { COMMENT_REGEX, ENCLOSED_STRING_REGEX } from 'utils/regex.ts'

/**
 * `Deno lint` rule to enforce a maximum line width limit in the code.
 *
 * This rule ensures that no line exceeds a certain maximum width (default is 100 characters).
 * Limiting line length enhances code readability and helps maintain a consistent code style.
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

          const exceptions = lineLength <= maxLineWidth ||
            cleanLine.startsWith('import ') ||
            cleanLine.replace(ENCLOSED_STRING_REGEX, '').length < 2 ||
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
