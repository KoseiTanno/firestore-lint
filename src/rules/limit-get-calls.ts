import type { Diagnostic, Rule } from '../types.js'
import { countCalls, walkAllows } from './walk.js'

const LOOKUP_FUNCTIONS = ['get', 'exists', 'getAfter']
const THRESHOLD = 3

export const limitGetCalls: Rule = {
  id: 'limit-get-calls',
  severity: 'warn',
  check(ast) {
    const diagnostics: Diagnostic[] = []
    walkAllows(ast, (allow) => {
      const count = countCalls(allow.condition, LOOKUP_FUNCTIONS)
      if (count >= THRESHOLD) {
        diagnostics.push({
          ruleId: 'limit-get-calls',
          severity: 'warn',
          message: `This condition performs ${count} document lookups; each is a billed read (max 10 per request).`,
          line: allow.line,
          column: allow.column,
        })
      }
    })
    return diagnostics
  },
}
