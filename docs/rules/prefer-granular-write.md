# prefer-granular-write

**Severity:** warn

## What it does

Flags `allow write` and suggests splitting it into `create`, `update`, and
`delete`.

## Why it matters

`write` is shorthand for all three operations at once, so a single
condition has to be correct for all of them simultaneously. In practice
they need different checks:

- **create** validates the initial shape of a new document.
- **update** must additionally prevent fields from being changed that only
  the server should own (`role`, `createdAt`, `status`).
- **delete** is often the operation you did not intend to grant at all.

Writing `allow write` usually means the delete case was never considered.

An explicit deny (`allow write: if false;`) is not reported — closing all
three at once is unambiguous and safe.

## Incorrect

```
match /posts/{postId} {
  allow write: if request.auth.uid == resource.data.authorId;
}
```

## Correct

```
match /posts/{postId} {
  allow create: if request.auth.uid == request.resource.data.authorId;
  allow update: if request.auth.uid == resource.data.authorId
    && request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['title', 'body']);
  allow delete: if false;
}
```
