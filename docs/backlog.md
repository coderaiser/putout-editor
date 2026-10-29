# Backlog

Open defects, ideas not started, and rejected ideas. When an item is done, delete it here and
put the lesson in the topic file. Each defect has: minimum repro, result, expected result.
Write only what you verified. Mark an unverified idea as a guess.

## Open defects

### Chat: `@lezer` is in the initial payload

- Repro: build `packages/chat` into an empty `out/chat`. Sum the `<script>` files that
  `index.html` loads.
- Result: the large shared chunk carries 🐊**Putout**'s parser tree and `@lezer`, because
  `@putout/editor-commands` imports it statically.
- Expected: `@lezer` loads after the first render.
- A `cacheGroup` in `packages/chat` cannot move it. Deferring the import changes what the
  first render can do, so it needs a decision.

### `remove-comments` reports one comment twice

- Repro, in `packages/plugin-putout-editor`:

  ```js
  const a = [
      1,
  ];
  
  // between two
  const b = 2;
  ```

- Result: 2 places. Expected: 1.
- Cause: the parser attaches a comment between two statements to both. The fix removes it once,
  so only the count is wrong.

### Upstream fixers exit 0 on lossy fixes

`convert-optional-to-logical`, `apply-destructuring` (on `return`), `apply-type-check`
(self-assignment), `objects-braces-inside-array` (comment lines). Details in
[`rules.md`](./rules.md#upstream-fixer-traps). Proposal for upstream: a fixer that changes
evaluation count or drops a guard must report, not fix silently. For
`convert-optional-to-logical`, bind the receiver when it is a call.

## Ideas

| # | Idea | Size |
|---|---|---|
| 1 | Require a body on `fix:` commits | S |
| 2 | Fewer CI auto-lint commits | M |
| 3 | A rule for `t.ok(x in y)` and other assertions with no diff | S |
| 4 | Write up `plugin-putout-editor` in TypeScript | S |
| 5 | Fixers for `hoist-arrow-callback` and `check-try-catch-destructure` | M |
| 6 | Find `match` guards that the key already makes dead | S |

1. **Body on `fix:`.** Most `fix:` commits have no body, so the cause is lost. Add a commit
   template, or a CI check on the latest `fix:` commit.
2. **Auto-lint commits.** CI commits `fix:lint` output as `chore: … actions: lint ☘️`. These
   commits are not reviewed. Options: make `fix:lint` change less, or open a PR instead of a
   push. Measure the current share first: it was falling.
3. **`t.ok` with no diff.** `t.ok('field' in schema.shape)` fails with no information.
   `t.deepEqual(Object.keys(schema.shape), ['field'])` names the missing field. The `in` shape
   has a mechanical fix. Belongs in `@putout/plugin-tape`. `tape/convert-equal-to-ok` pushes the
   other way.
4. **TypeScript write-up.** The rule contract is typed upstream (`@putout/types`). Migrate one
   rule end to end (`check-main-imports-in-file`) and decide what to do with the
   `__putout_processor_filesystem(...)` fixtures. `test:dts` is `echo "no types"` now.
5. **Fixers.** `hoist-arrow-callback`: hoisting `(file) => isFile(file)` needs a new name, and
   a used parameter shadows the outer name (`SHAPES.some((shape) => isFunction(plugin[shape]))`).
   Hoist only when the parameter is unused, and check the scope for collisions.
   `check-try-catch-destructure`: the rewrite is always "bind, then guard".
6. **Dead guards.** A guard in `match` that repeats what the key already decides is never
   false. Coverage finds it, a rule cannot. Delete such guards; add a `t.noReport` per real
   guard.

## Rejected

Do not propose these again without new evidence.

- **Insert the newline by hand in a controlled textarea.** The browser inserts it and React
  keeps it. An e2e proves it.
- **A rule for a method called with no receiver** (`({getAttribute}) => getAttribute(x)`). The
  fix needs a name the pattern does not bind, and 🐊**Putout** rejects it
  (`template values not linked`). A report-only `find` cannot run. There are 0 such sites.
- **A rule that forbids `100vh` in chat CSS.** A rule cannot be scoped to one package without
  a filesystem rule. The e2e `the document does not scroll` tests the real property.
- **A `PATH` export for `rspack: not found`.** The cause is a nested `node_modules`. See
  [`tooling.md`](./tooling.md#redrun).
- **`IgnorePlugin` for 🐊**Putout** processors.** The build passes and the page fails. See
  [`frontend.md`](./frontend.md).
- **Fail supertape when a glob matches nothing.** A new package legitimately has no spec files.
- **Exclude `Input.spec.tsx` from typos.** Allow the one identifier instead.
