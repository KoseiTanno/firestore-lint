import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { lint } from '../../src/linter.js'
import { noExpiredTestMode } from '../../src/rules/no-expired-test-mode.js'

const NOW = new Date('2026-08-14T00:00:00Z')
const run = (src: string) => lint(src, { rules: [noExpiredTestMode], now: NOW })
const wrap = (body: string) => `service cloud.firestore { match /db/{d}/documents { ${body} } }`

describe('no-expired-test-mode', () => {
  it('reports an expired test-mode rule and says it now denies everything', () => {
    const found = run(wrap('allow read, write: if request.time < timestamp.date(2026, 6, 1);'))
    expect(found).toHaveLength(1)
    expect(found[0]?.message).toContain('expired')
    expect(found[0]?.message).toContain('2026-06-01')
  })

  it('reports an active test-mode rule and says it is open to everyone', () => {
    const found = run(wrap('allow read, write: if request.time < timestamp.date(2026, 12, 31);'))
    expect(found).toHaveLength(1)
    expect(found[0]?.message).toContain('open to everyone')
  })

  it('falls back to a generic message when the date is not literal', () => {
    const found = run(wrap('allow read: if request.time < timestamp.date(cfg.y, cfg.m, cfg.d);'))
    expect(found).toHaveLength(1)
    expect(found[0]?.message).toContain('Time-limited')
  })

  it('does not report normal timestamp comparisons', () => {
    expect(run(wrap('allow create: if request.resource.data.createdAt == request.time;'))).toEqual(
      [],
    )
  })

  it('is clean against the real okoshite rules', async () => {
    const source = await readFile('tests/fixtures/okoshite.rules', 'utf8')
    expect(run(source)).toEqual([])
  })
})
