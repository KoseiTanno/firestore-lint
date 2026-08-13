import { describe, expect, it } from 'vitest'
import { formatJson } from '../src/reporters/json.js'
import { formatPretty } from '../src/reporters/pretty.js'
import type { Diagnostic } from '../src/types.js'

const diags: Diagnostic[] = [
  { ruleId: 'no-public-read', severity: 'error', message: 'wide open', line: 3, column: 7 },
  { ruleId: 'limit-get-calls', severity: 'warn', message: 'too many gets', line: 9, column: 5 },
]

describe('formatPretty', () => {
  it('includes the file path, positions, severities, and rule ids', () => {
    const out = formatPretty(diags, 'a\nb\nc', 'firestore.rules', { color: false })
    expect(out).toContain('firestore.rules')
    expect(out).toContain('3:7')
    expect(out).toContain('error')
    expect(out).toContain('no-public-read')
  })

  it('summarises the counts', () => {
    const out = formatPretty(diags, '', 'f.rules', { color: false })
    expect(out).toContain('2 problems')
    expect(out).toContain('1 error')
    expect(out).toContain('1 warning')
  })

  it('reports a clean file', () => {
    expect(formatPretty([], '', 'f.rules', { color: false })).toContain('No problems')
  })

  it('omits ansi codes when color is disabled', () => {
    expect(formatPretty(diags, '', 'f.rules', { color: false })).not.toContain('\x1b[')
  })

  it('emits ansi codes when color is enabled', () => {
    expect(formatPretty(diags, '', 'f.rules', { color: true })).toContain('\x1b[')
  })
})

describe('formatJson', () => {
  it('produces parseable json keyed by file', () => {
    const parsed = JSON.parse(formatJson([{ filePath: 'f.rules', diagnostics: diags }]))
    expect(parsed[0].filePath).toBe('f.rules')
    expect(parsed[0].diagnostics).toHaveLength(2)
  })
})
