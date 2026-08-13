# Contributing

## Requirements

- Node.js 22.13 or newer (pnpm 11 requires it; the published package itself
  runs on Node 20+)
- pnpm — `corepack enable pnpm` installs the exact version pinned in
  `package.json`

## Setup

```
pnpm install
pnpm build
pnpm test
```

## Checks

Every pull request must pass all three:

```
pnpm lint        # Biome — formatting and lint rules
pnpm typecheck   # tsc --noEmit
pnpm test:cov    # vitest with coverage
```

Run `pnpm format` before committing; `pnpm lint` treats formatting
differences as failures.

## Adding a rule

Rules are independent of each other and of the engine. Adding one takes
four steps:

1. **Implement it** in `src/rules/<rule-id>.ts`, exporting a `Rule` object:

   ```
   export const myRule: Rule = {
     id: 'my-rule',
     severity: 'warn',
     check(ast, ctx) { /* return Diagnostic[] */ },
   }
   ```

   Use the helpers in `src/rules/walk.ts` (`walkAllows`, `conditionText`,
   `countCalls`, …) rather than traversing the AST by hand.

2. **Register it** by adding one line to the array in
   `src/rules/index.ts`.

3. **Test it** in `tests/rules/<rule-id>.test.ts`. Every rule needs both
   cases it *should* report and cases it *should not* — the second kind is
   what keeps false positives out, and a rule that fires on valid code will
   simply be turned off by users.

4. **Document it** in `docs/rules/<rule-id>.md`, following the existing
   structure: what it does, why it matters, an incorrect example, a correct
   example, and any known limitations.

Then add the rule to the tables in `README.md` and `README.ja.md`.

## Design constraints

Two decisions shape what belongs in this project. Read the ADRs before
proposing changes that conflict with them:

- [ADR-0001](./docs/adr/0001-lightweight-parser.md) — conditions are kept
  as token arrays, not parsed into an expression tree. Rules must work with
  token-level inspection.
- [ADR-0002](./docs/adr/0002-no-autofix.md) — this tool never modifies
  rules files. Do not add a `--fix` flag.

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/), in
English:

```
feat(rules): add no-public-read rule
fix(parser): handle nested match blocks
docs(adr): record why we skip full CEL parsing
```

One logical change per branch and per pull request. Pull requests are
squash-merged, so the commit title becomes the entry in the history.

## Releases

Releases are automated with [Changesets](https://github.com/changesets/changesets).
Add one to any pull request that changes behaviour:

```
pnpm changeset
```

Merging to `main` opens a version bump pull request; merging that publishes
to npm.
