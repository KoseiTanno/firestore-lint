# limit-get-calls

**Severity:** warn

## What it does

Flags a single `allow` condition containing three or more calls to
`get()`, `exists()`, or `getAfter()`.

## Why it matters

Document lookups inside security rules are not free in either sense:

- **They are billed.** Each `get()` counts as a document read on your bill,
  on top of the read the user actually requested. A rule with four lookups
  turns one user action into five billed reads.
- **They are capped.** Cloud Firestore allows at most 10 document access
  calls per single-document request (20 for multi-document requests).
  Exceeding the limit makes the request fail, not slow down.

Rules that grew organically — "also check the group", "also check the
membership" — drift toward this limit without anyone noticing, because
nothing fails until the day it does.

The usual fix is to denormalize: store the value the rule needs on the
document itself, or in a custom auth claim, so no lookup is required.

## Incorrect

```
match /users/{userId} {
  allow read: if request.auth != null && (
    request.auth.uid == userId ||
    (
      exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.groupIds.size() > 0 &&
      get(/databases/$(database)/documents/users/$(userId)).data.groupIds.hasAny(
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.groupIds
      )
    )
  );
}
```

## Correct

```
match /users/{userId} {
  allow read: if request.auth != null && (
    request.auth.uid == userId ||
    request.auth.token.groupIds.hasAny(resource.data.groupIds)
  );
}
```

## Known limitations

Calls are counted textually, not evaluated. A lookup inside a
short-circuited branch (`a && get(...)`) that never runs at request time is
still counted. See
[ADR-0001](../adr/0001-lightweight-parser.md) for why this trade-off was
accepted, and why the severity is `warn` rather than `error`.
