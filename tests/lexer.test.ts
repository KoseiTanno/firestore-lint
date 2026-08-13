import { describe, expect, it } from 'vitest'
import { tokenize } from '../src/lexer.js'

describe('tokenize', () => {
  it('records 1-based line and column for each token', () => {
    const tokens = tokenize('rules_version\n  = 2')
    expect(tokens[0]).toMatchObject({ value: 'rules_version', line: 1, column: 1 })
    expect(tokens[1]).toMatchObject({ value: '=', line: 2, column: 3 })
    expect(tokens[2]).toMatchObject({ value: '2', type: 'number', line: 2, column: 5 })
  })

  it('ends with an eof token', () => {
    const tokens = tokenize('allow read;')
    expect(tokens.at(-1)?.type).toBe('eof')
  })

  it('skips line comments but keeps line numbers correct', () => {
    const tokens = tokenize('// a comment\nallow')
    expect(tokens[0]).toMatchObject({ value: 'allow', line: 2, column: 1 })
  })

  it('skips block comments spanning multiple lines', () => {
    const tokens = tokenize('/* one\ntwo */ allow')
    expect(tokens[0]).toMatchObject({ value: 'allow', line: 2, column: 8 })
  })

  it('reads single and double quoted strings without the quotes', () => {
    const tokens = tokenize(`rules_version = '2'; let s = "hi";`)
    const strings = tokens.filter((t) => t.type === 'string')
    expect(strings.map((t) => t.value)).toEqual(['2', 'hi'])
  })

  it('treats multi-character operators as one token', () => {
    const tokens = tokenize('a == b && c != d')
    const ops = tokens.filter((t) => t.type === 'operator').map((t) => t.value)
    expect(ops).toEqual(['==', '&&', '!='])
  })

  it('tokenizes a match path into separate tokens', () => {
    const tokens = tokenize('match /users/{userId} {')
    expect(tokens.map((t) => t.value)).toEqual([
      'match',
      '/',
      'users',
      '/',
      '{',
      'userId',
      '}',
      '{',
      '',
    ])
  })

  it('does not crash on an unterminated string', () => {
    expect(() => tokenize(`let s = 'oops`)).not.toThrow()
  })

  it('tokenizes the real okoshite rules without throwing', async () => {
    const { readFile } = await import('node:fs/promises')
    const source = await readFile('tests/fixtures/okoshite.rules', 'utf8')
    const tokens = tokenize(source)
    expect(tokens.length).toBeGreaterThan(100)
    expect(tokens.at(-1)?.type).toBe('eof')
  })
})
