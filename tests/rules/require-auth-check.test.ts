import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { lint } from '../../src/linter.js'
import { requireAuthCheck } from '../../src/rules/require-auth-check.js'

const run = (src: string) => lint(src, { rules: [requireAuthCheck] })
const wrap = (body: string) => `service cloud.firestore { match /db/{d}/documents { ${body} } }`

describe('require-auth-check', () => {
  it('reports a rule with no auth check', () => {
    expect(run(wrap('allow write: if true;'))).toHaveLength(1)
  })

  it('reports a condition that only checks data shape', () => {
    expect(run(wrap('allow create: if request.resource.data.name is string;'))).toHaveLength(1)
  })

  it('does not report when request.auth is checked', () => {
    expect(run(wrap('allow read: if request.auth != null;'))).toEqual([])
  })

  it('does not report allow ...: if false', () => {
    expect(run(wrap('allow write: if false;'))).toEqual([])
  })

  it('follows a single level of function call', () => {
    const src = wrap(`
      function isSignedIn() { return request.auth != null; }
      allow read: if isSignedIn();
    `)
    expect(run(src)).toEqual([])
  })

  it('reports when the called function has no auth check', () => {
    const src = wrap(`
      function isRecent() { return request.time > resource.data.createdAt; }
      allow read: if isRecent();
    `)
    expect(run(src)).toHaveLength(1)
  })

  it('is clean against the real okoshite rules', async () => {
    const source = await readFile('tests/fixtures/okoshite.rules', 'utf8')
    expect(run(source)).toEqual([])
  })
})
