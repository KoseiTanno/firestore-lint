import { describe, expect, it } from 'vitest'
import { lint } from '../../src/linter.js'
import { requireRulesVersion } from '../../src/rules/require-rules-version.js'

const run = (src: string) => lint(src, { rules: [requireRulesVersion] })

describe('require-rules-version', () => {
  it('reports a missing declaration at line 1', () => {
    const found = run('service cloud.firestore { }')
    expect(found).toHaveLength(1)
    expect(found[0]).toMatchObject({ line: 1, column: 1 })
    expect(found[0]?.message).toContain('Missing')
  })

  it('reports version 1 as deprecated', () => {
    const found = run(`rules_version = '1';\nservice cloud.firestore { }`)
    expect(found).toHaveLength(1)
    expect(found[0]?.message).toContain('deprecated')
  })

  it('does not report version 2', () => {
    expect(run(`rules_version = '2';\nservice cloud.firestore { }`)).toEqual([])
  })
})
