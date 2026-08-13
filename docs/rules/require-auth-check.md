# require-auth-check

**Severity:** error

## What it does

Flags any `allow` statement whose condition never references `request.auth`,
directly or through a single function call.

## Why it matters

A condition that only checks the shape of the incoming data
(`request.resource.data.name is string`) says nothing about *who* is allowed
to write it. Without a `request.auth` check somewhere in the condition, the
rule effectively grants access to anyone, signed in or not.

## Incorrect

```
match /posts/{postId} {
  allow create: if request.resource.data.title is string;
}
```

## Correct

```
match /posts/{postId} {
  allow create: if request.auth != null
    && request.resource.data.title is string;
}
```

## Known limitations

This rule follows exactly one level of function indirection
(`allow read: if isOwner();` looks inside `isOwner`'s body). A chain of
functions calling other functions is not traced further than that.
