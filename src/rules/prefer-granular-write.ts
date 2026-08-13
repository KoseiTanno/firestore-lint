import type { Diagnostic, Rule } from '../types.js'
import { isLiteralFalse, walkAllows } from './walk.js'

export const preferGranularWrite: Rule = {
  id: 'prefer-granular-write',
  severity: 'warn',
  check(ast) {
    const diagnostics: Diagnostic[] = []
    walkAllows(ast, (allow) => {
      if (!allow.methods.includes('write')) return
      if (isLiteralFalse(allow.condition)) return

      diagnostics.push({
        ruleId: 'prefer-granular-write',
        severity: 'warn',
        message: 'Prefer create, update, and delete over the broad write method.',
        line: allow.line,
        column: allow.column,
      })
    })
    return diagnostics
  },
}
