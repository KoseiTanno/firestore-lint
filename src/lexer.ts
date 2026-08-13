import type { Token } from './types.js'

const TWO_CHAR_OPERATORS = ['==', '!=', '<=', '>=', '&&', '||']
const PUNCTUATION = new Set(['{', '}', '(', ')', '[', ']', ',', ';', ':'])

export function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let pos = 0
  let line = 1
  let column = 1

  function advance(): string {
    const ch = source[pos]
    pos++
    if (ch === '\n') {
      line++
      column = 1
    } else {
      column++
    }
    return ch ?? ''
  }

  function peek(offset = 0): string {
    return source[pos + offset] ?? ''
  }

  while (pos < source.length) {
    const startLine = line
    const startColumn = column
    const ch = peek()

    // whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      advance()
      continue
    }

    // line comment
    if (ch === '/' && peek(1) === '/') {
      while (pos < source.length && peek() !== '\n') advance()
      continue
    }

    // block comment
    if (ch === '/' && peek(1) === '*') {
      advance()
      advance()
      while (pos < source.length && !(peek() === '*' && peek(1) === '/')) advance()
      if (pos < source.length) {
        advance()
        advance()
      }
      continue
    }

    // strings
    if (ch === "'" || ch === '"') {
      const quote = ch
      advance()
      let value = ''
      while (pos < source.length && peek() !== quote) {
        value += advance()
      }
      if (pos < source.length) advance() // closing quote; if unterminated, just stop
      tokens.push({ type: 'string', value, line: startLine, column: startColumn })
      continue
    }

    // numbers
    if (/[0-9]/.test(ch)) {
      let value = ''
      while (pos < source.length && /[0-9.]/.test(peek())) value += advance()
      tokens.push({ type: 'number', value, line: startLine, column: startColumn })
      continue
    }

    // identifiers
    if (/[A-Za-z_]/.test(ch)) {
      let value = ''
      while (pos < source.length && /[A-Za-z0-9_]/.test(peek())) value += advance()
      tokens.push({ type: 'identifier', value, line: startLine, column: startColumn })
      continue
    }

    // two-character operators
    const twoChar = ch + peek(1)
    if (TWO_CHAR_OPERATORS.includes(twoChar)) {
      advance()
      advance()
      tokens.push({ type: 'operator', value: twoChar, line: startLine, column: startColumn })
      continue
    }

    // punctuation
    if (PUNCTUATION.has(ch)) {
      advance()
      tokens.push({ type: 'punctuation', value: ch, line: startLine, column: startColumn })
      continue
    }

    // everything else: single-character operator
    advance()
    tokens.push({ type: 'operator', value: ch, line: startLine, column: startColumn })
  }

  tokens.push({ type: 'eof', value: '', line, column })
  return tokens
}
