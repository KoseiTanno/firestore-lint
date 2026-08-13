import { describe, expect, it } from 'vitest'
import { lint } from '../src/linter.js'
import type { Rule } from '../src/types.js'

const noop: Rule = { id: 'noop', severity: 'info', check: () => [] }

describe('lint', () => {
  it('reports parse errors as diagnostics', () => {
    const found = lint('service cloud.firestore { match /a/{b} { allow read: if true }', {
      rules: [],
    })
    expect(found.some((d) => d.ruleId === 'parse-error')).toBe(true)
  })

  it('returns an empty array for valid source with no rules', () => {
    expect(lint(`rules_version = '2';`, { rules: [noop] })).toEqual([])
  })

  it('collects functions from nested match blocks into the context', () => {
    const spy: Rule = {
      id: 'spy',
      severity: 'info',
      check: (_ast, ctx) =>
        [...ctx.functions.keys()].map((name) => ({
          ruleId: 'spy',
          severity: 'info' as const,
          message: name,
          line: 1,
          column: 1,
        })),
    }
    const found = lint(
      `service cloud.firestore {
      function top() { return true; }
      match /a/{b} { function inner() { return false; } }
    }`,
      { rules: [spy] },
    )
    expect(found.map((d) => d.message).sort()).toEqual(['inner', 'top'])
  })

  it('sorts diagnostics by line then column', () => {
    const noisy: Rule = {
      id: 'noisy',
      severity: 'warn',
      check: () => [
        { ruleId: 'noisy', severity: 'warn', message: 'b', line: 5, column: 1 },
        { ruleId: 'noisy', severity: 'warn', message: 'a', line: 2, column: 9 },
        { ruleId: 'noisy', severity: 'warn', message: 'c', line: 2, column: 3 },
      ],
    }
    expect(lint('service cloud.firestore {}', { rules: [noisy] }).map((d) => d.message)).toEqual([
      'c',
      'a',
      'b',
    ])
  })

  it('passes the injected now to rules', () => {
    const fixed = new Date('2020-01-01')
    const probe: Rule = {
      id: 'probe',
      severity: 'info',
      check: (_ast, ctx) => [
        {
          ruleId: 'probe',
          severity: 'info' as const,
          message: ctx.now.toISOString(),
          line: 1,
          column: 1,
        },
      ],
    }
    expect(lint('service cloud.firestore {}', { rules: [probe], now: fixed })[0]?.message).toBe(
      fixed.toISOString(),
    )
  })
})
