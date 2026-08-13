import type { Diagnostic, Rule, RuleContext, RulesAST, Token } from '../types.js'
import { hasIdentifier, walkAllows } from './walk.js'

// Looks for `timestamp.date(YYYY, M, D)` inside the condition and returns
// the constructed Date, or null if the date literal can't be resolved
// (e.g. it uses a variable instead of number literals).
function extractTestModeDate(condition: Token[]): Date | null | undefined {
  const idx = condition.findIndex((t) => t.value === 'timestamp')
  if (idx === -1) return undefined // no timestamp.date(...) at all

  // Expect: timestamp . date ( Y , M , D )
  const rest = condition.slice(idx)
  if (rest[1]?.value !== '.' || rest[2]?.value !== 'date' || rest[3]?.value !== '(') {
    return undefined
  }

  const year = rest[4]
  const month = rest[6]
  const day = rest[8]
  if (year?.type !== 'number' || month?.type !== 'number' || day?.type !== 'number') {
    return null // timestamp.date(...) present but args aren't literals
  }

  return new Date(Number(year.value), Number(month.value) - 1, Number(day.value))
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const noExpiredTestMode: Rule = {
  id: 'no-expired-test-mode',
  severity: 'error',
  check(ast: RulesAST, ctx: RuleContext) {
    const diagnostics: Diagnostic[] = []
    walkAllows(ast, (allow) => {
      if (!hasIdentifier(allow.condition, 'time')) return
      const date = extractTestModeDate(allow.condition)
      if (date === undefined) return // no timestamp.date(...) here

      let message: string
      if (date === null) {
        message = 'Time-limited test-mode rule found.'
      } else if (date.getTime() < ctx.now.getTime()) {
        message = `Test-mode rule expired on ${formatDate(date)}; this path now denies all access.`
      } else {
        message = `Test-mode rule expires on ${formatDate(date)}; until then this path is open to everyone.`
      }

      diagnostics.push({
        ruleId: 'no-expired-test-mode',
        severity: 'error',
        message,
        line: allow.line,
        column: allow.column,
      })
    })
    return diagnostics
  },
}
