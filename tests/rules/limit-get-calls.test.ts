import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { lint } from '../../src/linter.js'
import { limitGetCalls } from '../../src/rules/limit-get-calls.js'

const run = (src: string) => lint(src, { rules: [limitGetCalls] })
const wrap = (body: string) => `service cloud.firestore { match /db/{d}/documents { ${body} } }`

describe('limit-get-calls', () => {
  it('does not report two lookups', () => {
    expect(run(wrap('allow read: if exists(/a/$(x)) && get(/a/$(x)).data.ok == true;'))).toEqual([])
  })

  it('reports three lookups and states the count', () => {
    const found = run(
      wrap(`allow read: if
      exists(/a/$(x)) &&
      get(/a/$(x)).data.n > 0 &&
      get(/b/$(y)).data.m > 0;`),
    )
    expect(found).toHaveLength(1)
    expect(found[0]?.severity).toBe('warn')
    expect(found[0]?.message).toContain('3')
  })

  it('counts getAfter as a lookup', () => {
    expect(
      run(wrap('allow write: if get(/a/$(x)).x && getAfter(/a/$(x)).y && exists(/b/$(z));')),
    ).toHaveLength(1)
  })

  it('counts each allow independently', () => {
    expect(
      run(
        wrap(`
      allow read: if get(/a/$(x)).a && get(/b/$(x)).b;
      allow write: if get(/a/$(x)).a && get(/b/$(x)).b;
    `),
      ),
    ).toEqual([])
  })

  it('flags the real okoshite users read rule', async () => {
    const source = await readFile('tests/fixtures/okoshite.rules', 'utf8')
    const found = run(source)
    expect(found.length).toBeGreaterThan(0)
    expect(found[0]?.ruleId).toBe('limit-get-calls')
  })
})
