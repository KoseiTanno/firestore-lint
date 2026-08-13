# no-public-read

**Severity:** error

## What it does

Flags `allow read` (or `get`/`list`) statements guarded only by `if true`.

## Why it matters

`allow read: if true;` exposes every document under that path to anyone on
the internet, whether or not they are signed in. This is often left over
from Firebase's "Start in test mode" default, which sets an expiring
`if true` — but the moment it expires, `read` fails closed and the app
silently breaks instead.

## Incorrect

```
match /users/{userId} {
  allow read: if true;
}
```

## Correct

```
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
}
```
