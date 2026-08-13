import type { Diagnostic, Rule, RuleContext, RulesAST, Token } from '../types.js'
import { hasIdentifier, isLiteralFalse, walkAllows } from './walk.js'

// If the condition is a single bare function call like `isSignedIn()`,
// return that function's name. Otherwise return null.
function asSoleFunctionCall(condition: Token[]): string | null {
  if (condition.length < 3) return null
  const [name, open, ...rest] = condition
  const close = rest.at(-1)
  if (name?.type !== 'identifier' || open?.value !== '(' || close?.value !== ')') return null
  return name.value
}

export const requireAuthCheck: Rule = {
  id: 'require-auth-check',
  severity: 'error',
  check(ast: RulesAST, ctx: RuleContext) {
    const diagnostics: Diagnostic[] = []
    walkAllows(ast, (allow) => {
      if (isLiteralFalse(allow.condition)) return

      let hasAuth = hasIdentifier(allow.condition, 'auth')

      if (!hasAuth) {
        const fnName = asSoleFunctionCall(allow.condition)
        if (fnName) {
          const fn = ctx.functions.get(fnName)
          if (fn) hasAuth = hasIdentifier(fn.body, 'auth')
        }
      }

      if (!hasAuth) {
        diagnostics.push({
          ruleId: 'require-auth-check',
          severity: 'error',
          message: 'This rule grants access without checking request.auth.',
          line: allow.line,
          column: allow.column,
        })
      }
    })
    return diagnostics
  },
}
