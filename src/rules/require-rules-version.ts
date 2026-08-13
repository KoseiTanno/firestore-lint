import type { Diagnostic, Rule } from '../types.js'

export const requireRulesVersion: Rule = {
  id: 'require-rules-version',
  severity: 'warn',
  check(ast) {
    if (ast.rulesVersion === null) {
      return [
        {
          ruleId: 'require-rules-version',
          severity: 'warn',
          message: "Missing rules_version = '2'; the file falls back to v1 semantics.",
          line: 1,
          column: 1,
        },
      ]
    }

    if (ast.rulesVersion.value === '1') {
      return [
        {
          ruleId: 'require-rules-version',
          severity: 'warn',
          message: "rules_version '1' is deprecated; use '2'.",
          line: ast.rulesVersion.line,
          column: 1,
        },
      ]
    }

    return []
  },
}
