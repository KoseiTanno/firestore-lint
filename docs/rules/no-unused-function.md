# no-unused-function

**Severity:** info

## What it does

Reports a `function` that is declared but never referenced by any `allow`
condition or by another function's body.

## Why it matters

An unused helper in a rules file is usually one of two things, and both are
worth a look:

- **Dead code** left behind by a refactor, which makes the file harder to
  read and audit.
- **A check that was meant to be applied and silently is not.** A function
  named `isNotBanned()` sitting unused means banned users are not actually
  being blocked. The rules file looks like it handles the case; it does
  not.

The severity is `info` because an unused function is never itself a
vulnerability — it is a signal that the file and the author's intent may
have diverged.

A function that only calls itself is still reported; self-reference does
not count as usage.

## Incorrect

```
match /posts/{postId} {
  function isAuthor() {
    return request.auth.uid == resource.data.authorId;
  }
  allow update: if request.auth != null;
}
```

## Correct

```
match /posts/{postId} {
  function isAuthor() {
    return request.auth.uid == resource.data.authorId;
  }
  allow update: if isAuthor();
}
```
