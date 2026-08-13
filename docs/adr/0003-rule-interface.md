# ADR-0003: A minimal `Rule` interface with a flat registry

- Status: Accepted
- Date: 2026-08-14

## Context

This project ships nine rules today and is expected to grow. The core
engine (lexer, parser, linter runner) should not need to change every time
a rule is added, and each rule's tests should be able to run in isolation
without the rest of the rule set.

## Decision

Every rule implements the same small interface:

```ts
interface Rule {
  id: string
  severity: 'error' | 'warn' | 'info'
  check(ast: RulesAST, ctx: RuleContext): Diagnostic[]
}