# no-auth-only-read

**Severity:** warn

## What it does

Flags read-family methods (`read`, `get`, `list`) whose entire condition is
`request.auth != null` and nothing more.

## Why it matters

`request.auth != null` proves the caller is signed in. It proves nothing
about *which* user they are. On a path scoped to a specific user or group,
this means any account on the service — including one an attacker creates
in seconds — can read every document under it. Push tokens, email
addresses, and private notes are commonly exposed this way.

This is a warning rather than an error because some collections are
genuinely meant to be readable by all authenticated users (a shared
catalogue, public announcements). Confirm that is the intent before
suppressing it.

## Incorrect

```
match /users/{userId} {
  allow read: if request.auth != null;
}
```

## Correct

```
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
}
```
