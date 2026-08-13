# no-expired-test-mode

**Severity:** error

## What it does

Flags conditions that combine `request.time` with a `timestamp.date(...)`
literal — the shape Firebase generates when you choose "Start in test
mode". The message differs depending on whether the date has passed:

- **Expired** — the path now denies all access, and the app is broken.
- **Still open** — the path is readable and writable by anyone on the
  internet until that date.
- **Non-literal date** — a generic warning, since the value cannot be
  resolved statically.

## Why it matters

Test mode is meant to last a few days while you prototype. Both outcomes
are bad and both are silent: before the deadline every document is world-
readable and world-writable; after it, every request fails and users see an
app that simply stopped working. Neither state produces an error at deploy
time.

## Incorrect

```
match /{document=**} {
  allow read, write: if request.time < timestamp.date(2026, 6, 1);
}
```

## Correct

```
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## Known limitations

Only three-argument `timestamp.date(YYYY, M, D)` calls with numeric
literals are resolved to a concrete date. If the arguments are variables or
expressions, the rule still reports the finding but cannot say whether the
window is open or closed.
