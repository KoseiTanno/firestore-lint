# ADR-0002: Do not provide an autofix mode

- Status: Accepted
- Date: 2026-08-14

## Context

Linters commonly ship a `--fix` flag that rewrites the source file to
resolve findings automatically. Users may expect the same from a security
rules linter.

## Decision

firestore-lint does not modify rules files. Every diagnostic links to a
`docs/rules/<id>.md` page with a corrected example, but applying the fix is
always a manual, reviewed edit by the person who owns the rules file.

## Alternatives considered

**Autofix only the "obviously safe" findings** (e.g., inserting
`rules_version = '2';` when missing). Rejected because even this narrower
scope sets a precedent that a machine can silently change access-control
logic, and the line between "safe" and "not safe" is not fixed — a rule
that looks purely cosmetic today (e.g., normalizing `allow write` into
`create, update, delete`) can interact with application code that depended
on the old, broader grant.

## Consequences

Users get a strictly weaker tool than an autofixing linter in terms of
convenience. In exchange, no automated process can ever silently widen or
narrow access to a Firestore or Storage path — every change to a rules file
passes through the same review a human-authored change would. Given that a
rules-file bug can expose or lock out an entire user base in production,
this asymmetry (inconvenience vs. irreversible harm) is judged to favor
manual fixes.