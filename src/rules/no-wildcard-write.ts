import type { Diagnostic, MatchNode, Rule } from '../types.js'
import { isLiteralFalse, walkAllows } from './walk.js'

const WRITE_METHODS = new Set(['write', 'create', 'update', 'delete'])

function hasRecursiveWildcard(match: MatchNode): boolean {
  return /\{[^}]+=\*\*\}/.test(match.pathText)
}

export const noWildcardWrite: Rule = {
  id: 'no-wildcard-write',
  severity: 'error',
  check(ast) {
    const diagnostics: Diagnostic[] = []
    walkAllows(ast, (allow, match, ancestors) => {
      const hasWriteMethod = allow.methods.some((m) => WRITE_METHODS.has(m))
      if (!hasWriteMethod) return
      if (isLiteralFalse(allow.condition)) return

      const underWildcard = [...ancestors, match].some(hasRecursiveWildcard)
      if (underWildcard) {
        diagnostics.push({
          ruleId: 'no-wildcard-write',
          severity: 'error',
          message: 'Recursive wildcard path allows writes to every document beneath it.',
          line: allow.line,
          column: allow.column,
        })
      }
    })
    return diagnostics
  },
}
