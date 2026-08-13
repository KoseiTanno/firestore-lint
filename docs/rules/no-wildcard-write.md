# no-wildcard-write

**Severity:** error

## What it does

Flags any write-family method (`write`, `create`, `update`, `delete`)
allowed under a recursive wildcard path such as `match /{document=**}`.

## Why it matters

A recursive wildcard matches every document at that level *and every
document nested beneath it, at any depth*. Granting write access there
means a single condition governs collections that do not exist yet — every
future feature inherits it silently. A rule intended to let signed-in users
edit their own profile ends up letting them overwrite billing records,
audit logs, and other users' data.

An explicit deny (`if false`) is not reported, since that is the standard
way to close a path.

## Incorrect

```
match /{document=**} {
  allow write: if request.auth != null;
}
```

## Correct

```
match /users/{userId} {
  allow write: if request.auth.uid == userId;
}

match /{document=**} {
  allow write: if false;
}
```
