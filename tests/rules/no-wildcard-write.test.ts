import { describe, expect, it } from 'vitest'
import { lint } from '../../src/linter.js'
import { noWildcardWrite } from '../../src/rules/no-wildcard-write.js'

const run = (src: string) => lint(src, { rules: [noWildcardWrite] })

describe('no-wildcard-write', () => {
  it('reports write under a recursive wildcard', () => {
    const found = run(`service cloud.firestore {
      match /databases/{d}/documents {
        match /{document=**} { allow write: if request.auth != null; }
      }
    }`)
    expect(found).toHaveLength(1)
    expect(found[0]?.severity).toBe('error')
  })

  it('reports create, update, and delete as well', () => {
    for (const method of ['create', 'update', 'delete']) {
      const found = run(`service cloud.firestore {
        match /{document=**} { allow ${method}: if request.auth != null; }
      }`)
      expect(found, method).toHaveLength(1)
    }
  })

  it('does not report an explicit deny', () => {
    expect(
      run(`service cloud.firestore {
      match /{document=**} { allow write: if false; }
    }`),
    ).toEqual([])
  })

  it('does not report read-only wildcard rules', () => {
    expect(
      run(`service cloud.firestore {
      match /{document=**} { allow read: if request.auth != null; }
    }`),
    ).toEqual([])
  })

  it('does not report writes on a normal path', () => {
    expect(
      run(`service cloud.firestore {
      match /users/{userId} { allow write: if request.auth.uid == userId; }
    }`),
    ).toEqual([])
  })

  it('reports a write nested below the wildcard match', () => {
    expect(
      run(`service cloud.firestore {
      match /{document=**} {
        match /sub/{id} { allow update: if true; }
      }
    }`),
    ).toHaveLength(1)
  })
})
