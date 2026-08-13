# require-rules-version

**Severity:** warn

## What it does

Reports a missing `rules_version` declaration, or one explicitly set to the
deprecated `'1'`.

## Why it matters

Without `rules_version = '2';` at the top of the file, the rules engine
falls back to version 1 semantics. The differences are not cosmetic:

- **Recursive wildcards behave differently.** In v1, `{document=**}`
  matches only one path segment in some positions; in v2 it matches any
  depth. A rule you believe covers a subcollection may not.
- **`list` operations are not distinguished from `get`** in v1, so
  query-level restrictions you rely on may not apply.

Because the fallback is silent, a file can behave differently from what its
author read in the current documentation — which describes v2.

The declaration must be the first statement in the file.

## Incorrect

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
    }
  }
}
```

## Correct

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
    }
  }
}
```
