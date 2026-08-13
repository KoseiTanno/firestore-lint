import { describe, expect, it } from 'vitest'
import { lint } from '../../src/linter.js'
import { noUnusedFunction } from '../../src/rules/no-unused-function.js'

const run = (src: string) => lint(src, { rules: [noUnusedFunction] })

describe('no-unused-function', () => {
  it('reports a function that is never called', () => {
    const found = run(`service cloud.firestore {
      match /a/{b} {
        function unused() { return true; }
        allow read: if request.auth != null;
      }
    }`)
    expect(found).toHaveLength(1)
    expect(found[0]?.severity).toBe('info')
    expect(found[0]?.message).toContain('unused')
  })

  it('does not report a function used in an allow condition', () => {
    expect(
      run(`service cloud.firestore {
      match /a/{b} {
        function isOwner() { return request.auth != null; }
        allow read: if isOwner();
      }
    }`),
    ).toEqual([])
  })

  it('does not report a function called from another function', () => {
    expect(
      run(`service cloud.firestore {
      match /a/{b} {
        function isSignedIn() { return request.auth != null; }
        function isOwner() { return isSignedIn(); }
        allow read: if isOwner();
      }
    }`),
    ).toEqual([])
  })

  it('still reports a function that only calls itself', () => {
    expect(
      run(`service cloud.firestore {
      match /a/{b} {
        function loop() { return loop(); }
        allow read: if request.auth != null;
      }
    }`),
    ).toHaveLength(1)
  })
})
