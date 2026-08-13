import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { lint } from '../../src/linter.js'
import { noPublicRead } from '../../src/rules/no-public-read.js'

const run = (src: string) => lint(src, { rules: [noPublicRead] })
const wrap = (body: string) => `service cloud.firestore { match /db/{d}/documents { ${body} } }`

describe('no-public-read', () => {
  it('reports allow read: if true', () => {
    const found = run(wrap('allow read: if true;'))
    expect(found).toHaveLength(1)
    expect(found[0]?.ruleId).toBe('no-public-read')
    expect(found[0]?.severity).toBe('error')
  })

  it('reports get and list separately from read', () => {
    expect(run(wrap('allow get: if true;'))).toHaveLength(1)
    expect(run(wrap('allow list: if true;'))).toHaveLength(1)
  })

  it('reports when read is one of several methods', () => {
    expect(run(wrap('allow read, write: if true;'))).toHaveLength(1)
  })

  it('does not report a guarded read', () => {
    expect(run(wrap('allow read: if request.auth != null;'))).toEqual([])
  })

  it('does not report allow read: if false', () => {
    expect(run(wrap('allow read: if false;'))).toEqual([])
  })

  it('does not report write-only rules', () => {
    expect(run(wrap('allow write: if true;'))).toEqual([])
  })

  it('is clean against the real okoshite rules', async () => {
    const source = await readFile('tests/fixtures/okoshite.rules', 'utf8')
    expect(run(source)).toEqual([])
  })
})
