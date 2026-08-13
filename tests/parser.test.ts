import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { parse } from '../src/parser.js'

const SIMPLE = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
`

describe('parse', () => {
  it('extracts the rules_version declaration', () => {
    const ast = parse(SIMPLE)
    expect(ast.rulesVersion).toMatchObject({ value: '2', line: 2 })
  })

  it('returns null rulesVersion when the declaration is missing', () => {
    const ast = parse('service cloud.firestore { }')
    expect(ast.rulesVersion).toBeNull()
  })

  it('extracts the service name including dots', () => {
    const ast = parse(SIMPLE)
    expect(ast.services).toHaveLength(1)
    expect(ast.services[0]?.name).toBe('cloud.firestore')
  })

  it('nests match blocks', () => {
    const ast = parse(SIMPLE)
    const outer = ast.services[0]?.matches[0]
    expect(outer?.pathText).toBe('/databases/{database}/documents')
    expect(outer?.matches).toHaveLength(1)
    expect(outer?.matches[0]?.pathText).toBe('/users/{userId}')
  })

  it('collects allow statements with their methods', () => {
    const ast = parse(SIMPLE)
    const inner = ast.services[0]?.matches[0]?.matches[0]
    expect(inner?.allows.map((a) => a.methods)).toEqual([['read'], ['write']])
  })

  it('keeps the condition as raw tokens', () => {
    const ast = parse(SIMPLE)
    const inner = ast.services[0]?.matches[0]?.matches[0]
    expect(inner?.allows[0]?.condition.map((t) => t.value)).toEqual([
      'request',
      '.',
      'auth',
      '!=',
      'null',
    ])
  })

  it('parses comma separated methods', () => {
    const ast = parse(`service cloud.firestore {
      match /a/{b} { allow read, write: if true; }
    }`)
    expect(ast.services[0]?.matches[0]?.allows[0]?.methods).toEqual(['read', 'write'])
  })

  it('parses function declarations with params and body', () => {
    const ast = parse(`service cloud.firestore {
      match /a/{b} {
        function isOwner(uid) { return request.auth.uid == uid; }
        allow read: if isOwner(b);
      }
    }`)
    const fn = ast.services[0]?.matches[0]?.functions[0]
    expect(fn?.name).toBe('isOwner')
    expect(fn?.params).toEqual(['uid'])
    expect(fn?.body.map((t) => t.value)).toContain('request')
  })

  it('records the line number of each allow', () => {
    const ast = parse(SIMPLE)
    const inner = ast.services[0]?.matches[0]?.matches[0]
    expect(inner?.allows[0]?.line).toBe(6)
  })

  it('collects parse errors instead of throwing', () => {
    const ast = parse('service cloud.firestore { match /a/{b} { allow read: if true }')
    expect(ast.errors.length).toBeGreaterThan(0)
    expect(() => parse('} } } garbage')).not.toThrow()
  })

  it('parses the real okoshite rules', async () => {
    const source = await readFile('tests/fixtures/okoshite.rules', 'utf8')
    const ast = parse(source)
    expect(ast.errors).toEqual([])
    expect(ast.services[0]?.matches[0]?.matches.length).toBeGreaterThan(3)
  })
})
