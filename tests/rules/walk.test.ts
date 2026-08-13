import { describe, expect, it } from 'vitest'
import { parse } from '../../src/parser.js'
import {
  conditionText,
  countCalls,
  hasIdentifier,
  isLiteralFalse,
  isLiteralTrue,
  walkAllows,
  walkMatches,
} from '../../src/rules/walk.js'

describe('walkMatches', () => {
  it('visits every match including nested ones', () => {
    const ast = parse(`service cloud.firestore {
      match /a/{x} {
        match /b/{y} { allow read: if true; }
      }
    }`)
    const paths: string[] = []
    walkMatches(ast, (m) => paths.push(m.pathText))
    expect(paths).toEqual(['/a/{x}', '/b/{y}'])
  })

  it('passes the chain of ancestor matches', () => {
    const ast = parse(`service cloud.firestore {
      match /a/{x} {
        match /b/{y} { allow read: if true; }
      }
    }`)
    let ancestorPaths: string[] = []
    walkMatches(ast, (m, ancestors) => {
      if (m.pathText === '/b/{y}') ancestorPaths = ancestors.map((a) => a.pathText)
    })
    expect(ancestorPaths).toEqual(['/a/{x}'])
  })
})

describe('walkAllows', () => {
  it('visits every allow with its owning match', () => {
    const ast = parse(`service cloud.firestore {
      match /a/{x} {
        allow read: if true;
        match /b/{y} { allow write: if false; }
      }
    }`)
    const seen: string[] = []
    walkAllows(ast, (allow, match) => {
      seen.push(`${match.pathText}:${allow.methods.join(',')}`)
    })
    expect(seen).toEqual(['/a/{x}:read', '/b/{y}:write'])
  })
})

describe('conditionText', () => {
  it('concatenates token values', () => {
    const ast = parse(`service cloud.firestore {
      match /a/{x} { allow read: if request.auth != null; }
    }`)
    const allow = ast.services[0]?.matches[0]?.allows[0]
    expect(conditionText(allow?.condition ?? [])).toBe('request.auth!=null')
  })
})

describe('isLiteralTrue / isLiteralFalse', () => {
  it('detects a bare true condition', () => {
    const ast = parse(`service cloud.firestore {
      match /a/{x} { allow read: if true; }
    }`)
    const allow = ast.services[0]?.matches[0]?.allows[0]
    expect(isLiteralTrue(allow?.condition ?? [])).toBe(true)
    expect(isLiteralFalse(allow?.condition ?? [])).toBe(false)
  })

  it('detects a bare false condition', () => {
    const ast = parse(`service cloud.firestore {
      match /a/{x} { allow write: if false; }
    }`)
    const allow = ast.services[0]?.matches[0]?.allows[0]
    expect(isLiteralFalse(allow?.condition ?? [])).toBe(true)
    expect(isLiteralTrue(allow?.condition ?? [])).toBe(false)
  })

  it('does not treat a guarded condition as literal true or false', () => {
    const ast = parse(`service cloud.firestore {
      match /a/{x} { allow read: if request.auth != null; }
    }`)
    const allow = ast.services[0]?.matches[0]?.allows[0]
    expect(isLiteralTrue(allow?.condition ?? [])).toBe(false)
    expect(isLiteralFalse(allow?.condition ?? [])).toBe(false)
  })
})

describe('countCalls', () => {
  it('counts matching function-style calls', () => {
    const ast = parse(`service cloud.firestore {
      match /a/{x} {
        allow read: if exists(/a/$(x)) && get(/a/$(x)).data.n > 0 && get(/b/$(y)).data.m > 0;
      }
    }`)
    const allow = ast.services[0]?.matches[0]?.allows[0]
    expect(countCalls(allow?.condition ?? [], ['get', 'exists', 'getAfter'])).toBe(3)
  })

  it('returns zero when there are no matches', () => {
    const ast = parse(`service cloud.firestore {
      match /a/{x} { allow read: if request.auth != null; }
    }`)
    const allow = ast.services[0]?.matches[0]?.allows[0]
    expect(countCalls(allow?.condition ?? [], ['get', 'exists', 'getAfter'])).toBe(0)
  })
})

describe('hasIdentifier', () => {
  it('finds an identifier used anywhere in the condition', () => {
    const ast = parse(`service cloud.firestore {
      match /a/{x} { allow read: if request.auth != null; }
    }`)
    const allow = ast.services[0]?.matches[0]?.allows[0]
    expect(hasIdentifier(allow?.condition ?? [], 'auth')).toBe(true)
    expect(hasIdentifier(allow?.condition ?? [], 'nonexistent')).toBe(false)
  })
})
