import type { Diagnostic, FunctionNode, Rule, Token } from '../types.js'
import { walkAllows, walkMatches } from './walk.js'

function collectFunctionsWithLocation(ast: Parameters<Rule['check']>[0]): { fn: FunctionNode }[] {
  const collected: { fn: FunctionNode }[] = []
  for (const service of ast.services) {
    for (const fn of service.functions) collected.push({ fn })
  }
  walkMatches(ast, (match) => {
    for (const fn of match.functions) collected.push({ fn })
  })
  return collected
}

function usesIdentifier(tokens: Token[], name: string): boolean {
  return tokens.some((t) => t.type === 'identifier' && t.value === name)
}

export const noUnusedFunction: Rule = {
  id: 'no-unused-function',
  severity: 'info',
  check(ast) {
    const diagnostics: Diagnostic[] = []
    const allFunctions = collectFunctionsWithLocation(ast)

    for (const { fn } of allFunctions) {
      let used = false

      walkAllows(ast, (allow) => {
        if (usesIdentifier(allow.condition, fn.name)) used = true
      })

      if (!used) {
        for (const { fn: other } of allFunctions) {
          if (other === fn) continue // don't count self-reference (recursion)
          if (usesIdentifier(other.body, fn.name)) {
            used = true
            break
          }
        }
      }

      if (!used) {
        diagnostics.push({
          ruleId: 'no-unused-function',
          severity: 'info',
          message: `Function '${fn.name}' is never used.`,
          line: fn.line,
          column: fn.column,
        })
      }
    }

    return diagnostics
  },
}
