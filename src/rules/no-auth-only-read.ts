import type { Diagnostic, Rule } from '../types.js'
import { conditionText, walkAllows } from './walk.js'

const READ_METHODS = new Set(['read', 'get', 'list'])

const AUTH_ONLY_PATTERNS = new Set([
  'request.auth!=null',
  '(request.auth!=null)',
  'request.auth.uid!=null',
  '(request.auth.uid!=null)',
])

export const noAuthOnlyRead: Rule = {
  id: 'no-auth-only-read',
  severity: 'warn',
  check(ast) {
    const diagnostics: Diagnostic[] = []
    walkAllows(ast, (allow) => {
      const hasReadMethod = allow.methods.some((m) => READ_METHODS.has(m))
      if (!hasReadMethod) return

      if (AUTH_ONLY_PATTERNS.has(conditionText(allow.condition))) {
        diagnostics.push({
          ruleId: 'no-auth-only-read',
          severity: 'warn',
          message: 'Any signed-in user can read this path. Add an ownership or membership check.',
          line: allow.line,
          column: allow.column,
        })
      }
    })
    return diagnostics
  },
}
