/**
 * @param ctx - Rule Context
 * @param callback - Callback Visitor
 * @returns
 */
export function Line(
  ctx: Deno.lint.RuleContext,
  callback: (
    opts: {
      node: Deno.lint.Program
      line: string
      lineStart: number
      lineEnd: number
      lineLength: number
      index: number
      lines: string[]
    },
  ) => void,
): Deno.lint.LintVisitor {
  return {
    Program(node) {
      const baseCode = ctx.sourceCode.text

      const lines = baseCode.split('\n')
      let lineStart = 0
      lines.forEach((line, index) => {
        const lineLength = line.length
        const lineEnd = lineStart + lineLength

        callback({ line, node, lineStart, lineEnd, lineLength, index, lines })

        lineStart += lineLength + 1
      })
    },
  }
}
