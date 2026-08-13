# ADR-0001: Use a lightweight parser instead of a full CEL grammar

- Status: Accepted
- Date: 2026-08-14

## Context

Cloud Firestore and Cloud Storage rules use a language based on the Common
Expression Language (CEL). Implementing a complete CEL parser is a
significant undertaking — CEL supports arbitrary expressions, macros, and a
large standard library. This linter needs to detect nine specific patterns
(public reads, missing auth checks, wildcard writes, expired test-mode
windows, excessive document lookups, and so on). None of these patterns
require understanding what a condition *evaluates to* — they only require
recognizing *shapes* in the condition (a bare `true`, a call to `get(`, an
identifier named `auth`).

## Decision

The parser only builds a structural AST for `service` / `match` / `allow` /
`function` blocks. The condition inside each `allow` statement — and the
body of each `function` — is kept as a raw, unparsed array of tokens
(`Token[]`) rather than a full expression tree. Rules operate directly on
this token array: counting occurrences of an identifier, checking whether a
condition is literally `true`, or extracting numeric literals from a
`timestamp.date(...)` call.

## Alternatives considered

**(a) A full CEL grammar via a parser generator (peggy, chevrotain).**
This would produce a real expression AST, enabling deeper analysis (e.g.,
understanding operator precedence, short-circuit evaluation). Rejected
because the implementation and debugging cost of a complete CEL grammar is
large relative to the nine rules this tool needs, and the token-based
approach already covers all of them.

**(b) Depending on an existing parser (`firetree`, `firebase-rules-parser`).**
These exist on npm but have not been meaningfully maintained in several
years, and their type/API quality is unknown. Depending on an unmaintained
library for the core of a security tool creates a risk that cannot be
patched quickly if the library breaks or a bug is found in it. Rejected in
favor of full control over a small, well-tested surface.

## Consequences

The implementation is small (lexer + a recursive-descent parser for
structure only) and every rule's logic is easy to read and test in
isolation. The trade-off is that token-based inspection cannot distinguish
between a call that is always evaluated and one that only runs inside a
short-circuited branch (`a && get(...)`). Concretely, `limit-get-calls`
counts `get()`/`exists()`/`getAfter()` occurrences textually, which can
overcount relative to actual runtime evaluations. This is accepted by
pinning that rule's severity to `warn` rather than `error` — the false
positive rate is real but the cost of a false positive (a warning that
turns out to be unnecessary) is low, whereas a full CEL evaluator large
enough to fix it would not be justified by this tool's scope.