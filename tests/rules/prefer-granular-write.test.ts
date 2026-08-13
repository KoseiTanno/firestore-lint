import { describe, expect, it } from 'vitest'
import { lint } from '../../src/linter.js'
import { preferGranularWrite } from '../../src/rules/prefer-granular-write.js'

const run = (src: string) => lint(src, { rules: [preferGranularWrite] })
const wrap = (body: string) => `service cloud.firestore { match /db/{d}/documents { ${body} } }`

describe('prefer-granular-write', () => {
  it('reports a broad write', () => {
    const found = run(wrap('allow write: if request.auth.uid == userId;'))
    expect(found).toHaveLength(1)
    expect(found[0]?.severity).toBe('warn')
  })

  it('reports read, write combined', () => {
    expect(run(wrap('allow read, write: if request.auth != null;'))).toHaveLength(1)
  })

  it('does not report an explicit deny', () => {
    expect(run(wrap('allow read, write: if false;'))).toEqual([])
  })

  it('does not report granular methods', () => {
    expect(run(wrap('allow create, update: if request.auth.uid == userId;'))).toEqual([])
  })
})
