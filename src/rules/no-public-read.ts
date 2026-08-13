import type { Diagnostic, Rule } from '../types.js'
import { isLiteralTrue, walkAllows } from './walk.js'

const READ_METHODS = new Set(['read', 'get', 'list'])

export const noPublicRead: Rule = {
  id: 'no-public-read',
  severity: 'error',
  check(ast) {
    const diagnostics: Diagnostic[] = []
    walkAllows(ast, (allow) => {
      const hasReadMethod = allow.methods.some((m) => READ_METHODS.has(m))
      if (hasReadMethod && isLiteralTrue(allow.condition)) {
        diagnostics.push({
          ruleId: 'no-public-read',
          severity: 'error',
          message: `\`allow ${allow.methods.join(', ')}: if true\` exposes this path to the entire internet.`,
          line: allow.line,
          column: allow.column,
        })
      }
    })
    return diagnostics
  },
}
