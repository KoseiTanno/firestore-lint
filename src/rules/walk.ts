import type { AllowNode, MatchNode, RulesAST, Token } from '../types.js'

export function walkMatches(
  ast: RulesAST,
  visit: (match: MatchNode, ancestors: MatchNode[]) => void,
): void {
  function visitMatch(match: MatchNode, ancestors: MatchNode[]): void {
    visit(match, ancestors)
    const nextAncestors = [...ancestors, match]
    for (const child of match.matches) {
      visitMatch(child, nextAncestors)
    }
  }

  for (const service of ast.services) {
    for (const match of service.matches) {
      visitMatch(match, [])
    }
  }
}

export function walkAllows(
  ast: RulesAST,
  visit: (allow: AllowNode, match: MatchNode, ancestors: MatchNode[]) => void,
): void {
  walkMatches(ast, (match, ancestors) => {
    for (const allow of match.allows) {
      visit(allow, match, ancestors)
    }
  })
}

export function conditionText(condition: Token[]): string {
  return condition.map((t) => t.value).join('')
}

export function isLiteralTrue(condition: Token[]): boolean {
  return condition.length === 1 && condition[0]?.value === 'true'
}

export function isLiteralFalse(condition: Token[]): boolean {
  return condition.length === 1 && condition[0]?.value === 'false'
}

export function countCalls(condition: Token[], names: string[]): number {
  let count = 0
  for (let i = 0; i < condition.length - 1; i++) {
    const token = condition[i]
    const next = condition[i + 1]
    if (token?.type === 'identifier' && names.includes(token.value) && next?.value === '(') {
      count++
    }
  }
  return count
}

export function hasIdentifier(condition: Token[], name: string): boolean {
  return condition.some((t) => t.type === 'identifier' && t.value === name)
}
