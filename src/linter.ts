import { parse } from './parser.js'
import type { Diagnostic, FunctionNode, MatchNode, Rule } from './types.js'

function collectFunctions(matches: MatchNode[], into: Map<string, FunctionNode>): void {
  for (const match of matches) {
    for (const fn of match.functions) {
      into.set(fn.name, fn)
    }
    collectFunctions(match.matches, into)
  }
}

export function lint(source: string, options?: { rules?: Rule[]; now?: Date }): Diagnostic[] {
  const rules = options?.rules ?? []
  const now = options?.now ?? new Date()
  const ast = parse(source)

  const diagnostics: Diagnostic[] = ast.errors.map((e) => ({
    ruleId: 'parse-error',
    severity: 'error',
    message: e.message,
    line: e.line,
    column: e.column,
  }))

  const functions = new Map<string, FunctionNode>()
  for (const service of ast.services) {
    for (const fn of service.functions) {
      functions.set(fn.name, fn)
    }
    collectFunctions(service.matches, functions)
  }

  const context = { source, functions, now }

  for (const rule of rules) {
    diagnostics.push(...rule.check(ast, context))
  }

  diagnostics.sort((a, b) => {
    if (a.line !== b.line) return a.line - b.line
    if (a.column !== b.column) return a.column - b.column
    return a.ruleId.localeCompare(b.ruleId)
  })

  return diagnostics
}
