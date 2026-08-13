import { describe, expect, it } from 'vitest'
import { lint } from '../../src/linter.js'
import { noAuthOnlyRead } from '../../src/rules/no-auth-only-read.js'

const run = (src: string) => lint(src, { rules: [noAuthOnlyRead] })
const wrap = (body: string) => `service cloud.firestore { match /db/{d}/documents { ${body} } }`

describe('no-auth-only-read', () => {
  it('reports read guarded only by request.auth != null', () => {
    const found = run(wrap('allow read: if request.auth != null;'))
    expect(found).toHaveLength(1)
    expect(found[0]?.severity).toBe('warn')
  })

  it('reports the parenthesised form', () => {
    expect(run(wrap('allow read: if (request.auth != null);'))).toHaveLength(1)
  })

  it('does not report when an ownership check follows', () => {
    expect(run(wrap('allow read: if request.auth != null && request.auth.uid == userId;'))).toEqual(
      [],
    )
  })

  it('does not report write-only rules', () => {
    expect(run(wrap('allow write: if request.auth != null;'))).toEqual([])
  })
})
