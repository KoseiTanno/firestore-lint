# firestore-lint

[![CI](https://github.com/KoseiTanno/firestore-lint/actions/workflows/ci.yml/badge.svg)](https://github.com/KoseiTanno/firestore-lint/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/firestore-lint.svg)](https://www.npmjs.com/package/firestore-lint)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Static analysis for Firebase Firestore and Storage security rules.

[日本語版はこちら](./README.ja.md)

## The problem

Firestore Security Rules deploy instantly and take effect for every user the
moment `firebase deploy --only firestore:rules` finishes. There is no
staged rollout. A rules file left over from "Start in test mode" —

```
allow read, write: if request.time < timestamp.date(2024, 1, 1);
```

— silently opens the entire database to the public once that date has
technically not yet passed, and silently locks everyone out once it has.
Rules files are also the part of a codebase least likely to have tests:
they are declarative, easy to misread, and the consequences of a mistake
are invisible until an incident happens. firestore-lint checks for the
specific shapes that cause these incidents before you deploy.

## Quick start

```bash
npx firestore-lint firestore.rules
```

## Example output

Run against a real, production rules file:

```
firestore.rules
  11:7   warn   This condition performs 4 document lookups; each is a billed read (max 10 per request).  limit-get-calls
  49:9   warn   Prefer create, update, and delete over the broad write method.                            prefer-granular-write
  76:7   warn   Prefer create, update, and delete over the broad write method.                            prefer-granular-write

3 problems (3 warnings)
```

## Installation

```bash
npm install --save-dev firestore-lint
```

Requires Node.js 20+ to run the published package. Developing this
repository requires Node.js 22.13+ (see [CONTRIBUTING.md](./CONTRIBUTING.md)).

## Usage

```bash
firestore-lint <file...>            Human-readable output with color and line context
firestore-lint --format json <file> Machine-readable output for CI
firestore-lint --max-warnings 0     Fail the build on any warning, not just errors
```

Exit codes: `0` = no problems (or warnings within `--max-warnings`), `1` =
an error was found (or warnings exceeded `--max-warnings`), `2` = the
command itself failed (bad arguments, missing file).

## Rules

| Rule | Severity | Description |
| --- | --- | --- |
| [`no-public-read`](./docs/rules/no-public-read.md) | error | A read is guarded only by `if true` |
| [`require-auth-check`](./docs/rules/require-auth-check.md) | error | A rule grants access without checking `request.auth` |
| [`no-wildcard-write`](./docs/rules/no-wildcard-write.md) | error | A write is allowed under a recursive wildcard path |
| [`no-expired-test-mode`](./docs/rules/no-expired-test-mode.md) | error | A `timestamp.date(...)` test-mode window has expired or is still open |
| [`no-auth-only-read`](./docs/rules/no-auth-only-read.md) | warn | Any signed-in user can read; no ownership or membership check follows |
| [`limit-get-calls`](./docs/rules/limit-get-calls.md) | warn | A condition performs 3 or more document lookups |
| [`prefer-granular-write`](./docs/rules/prefer-granular-write.md) | warn | `allow write` is used instead of `create`/`update`/`delete` |
| [`require-rules-version`](./docs/rules/require-rules-version.md) | warn | `rules_version = '2'` is missing or set to the deprecated `'1'` |
| [`no-unused-function`](./docs/rules/no-unused-function.md) | info | A `function` is defined but never called |

## CI usage

```yaml
- run: npx firestore-lint firestore.rules --max-warnings 0
```

## How this differs from `@firebase/rules-unit-testing`

`@firebase/rules-unit-testing` answers: *"does this rule behave the way I
intended?"* You write a test, assert that a specific read or write succeeds
or fails, and the emulator tells you if your rule matches your intent.

firestore-lint answers a different question: *"is the intent itself
dangerous?"* It does not run against an emulator or require any test cases
— it reads the rules file and flags shapes that are dangerous regardless of
what the author meant. A rule you never thought to test against ("what if
someone reads this with no auth at all?") is exactly the rule
`@firebase/rules-unit-testing` cannot catch, because nobody wrote that
test. That's the gap this tool fills.

## Limitations

- Rules are checked as token sequences, not evaluated. `limit-get-calls`
  counts every `get()`/`exists()`/`getAfter()` call textually, including
  ones inside a short-circuited branch that would never actually run. See
  [ADR-0001](./docs/adr/0001-lightweight-parser.md) for the reasoning.
- No type or schema checking against your application's data model is
  performed.
- `require-auth-check` follows exactly one level of function indirection
  (`allow read: if isOwner();`); it does not follow a chain of functions
  calling functions.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT