# putout plugins

Rules in `packages/plugin-putout-editor` — the [README](../../packages/plugin-putout-editor/README.md)
has the ❌/✅ pair for each. `docs/plugins.md` is the guide for writing one.

| Rule                            | Kind       | What it found                                                         |
|---------------------------------|------------|-----------------------------------------------------------------------|
| `apply-press-modifier-case`     | code       | six `ControlOrMeta+V` in the e2e specs, passing while meaning nothing |
| `remove-comments`               | code       | the `scripts/check-comments.js` gate, as a rule                       |
| `remove-duplicated-receiver`    | code       | the receiver a `?.` expansion duplicated, 29 times, by hand            |
| `remove-rgb-outside-tokens`     | filesystem | the one hardcoded colour outside `css/tokens.css`                     |
| `remove-undefined-token`        | filesystem | a `var(--x)` `tokens.css` never defined, so it rendered nothing        |
| `remove-z-index-outside-tokens` | filesystem | seven raw `z-index` numbers, now a `--z-*` scale                      |

A **code** rule sees one file and runs under `putout .`. A **filesystem** rule is about a tree
and runs under `redlint`, because a 🐊**Putout** rule knows nothing about filenames. Both are in
`packages/client`'s `fix:lint`, so CI enforces them with no extra step.

What the rules that already work taught me is in
[`../memory/putout-rules.md`](../memory/putout-rules.md): report-only is possible, a rule can
see comments, and a missing rule is an argument rather than a workaround.

## 💡 a fixer that cannot detect its own lossy cases exits clean
`convert-optional-to-logical` is net-positive and I would not turn it off — but it exits 0 on
code it has made type-unsound, and the type checker is what finds out. That gap is the finding;
the rule works, the report is missing.

**Before.** `export const parse = (state) => getParseResult(state)?.ast;` and
`export const label = (el) => el().text?.trim();`

**After `putout . --fix`** — note `el()` is now called twice, and it is a call:
`export const label = (el) => el().text && el().text.trim();` The first line becomes
`export const parse = (state) => getParseResult(state) && getParseResult(state).ast;`

**Expected.** The receiver bound once, or a report that the fix is lossy. **Got** — a clean exit,
and then `tsc`, which is the only thing that noticed:

```
a.ts(5,45): error TS2531: Object is possibly 'null'.
```

`?.` narrows a type and `x && x.y` does not, so the conversion is type-preserving only if
something re-establishes the narrowing. A rule cannot do that: it sees one AST and no types, so
`a?.b` and `a && a.b` are equally correct as far as it is concerned.

### What it cost, measured

One `--fix` over ~60 files in this repository: **29 `tsc` errors** (25 × TS2531, 3 × TS2722,
1 × TS2532), **2 sites the fixer rewrote into code that does not parse** (a `?.` on a multi-line
TS cast), and **9 bare expressions** where `onToggle && onToggle();` tripped
`no-unused-expressions`. All of it fixed by hand. The repository runs `tsc` in CI, so the gate
caught it — which is the point: **this is what a type-aware reviewer is for, and the tools should
say so rather than exit clean.**

Two of the three are invisible to any single-file linter and need no types at all: a duplicated
call receiver and a bare logical expression. The first is now `remove-duplicated-receiver` in
`packages/plugin-putout-editor`, which **fixes** in all three statement contexts — a declaration
is split, a return gets the binding above it, and a concise arrow body becomes a block. The
second is a report, because there is no safe automatic shape for it.

### Why this is not "fixers are worse than humans"

The honest accounting is per rule, not per tool. 🐊**Putout** is what migrated 🐊**Putout**:
`plugin-nodejs` ships `convert-commonjs-to-esm/{exports,common,require}` and the repository's own
`package.json` is `"type": "module"`. It is also four rules of
`convert-rc-to-flat` + `apply-match-to-flat` + `apply-dir-to-flat` +
`remove-useless-match-to-flat` sitting **next to** jscodeshift in the eslint migration, not
instead of it — which is the division of labour that works: the mechanical pass by machine, the
judgement calls by a rule, and the result by a person or a type checker.

`convert-optional-to-logical` ships `off` by default, which is the right posture for a fixer
whose blind spot is invisible. The missing piece is not the default; it is that nothing tells you
the blind spot was hit.

### The proposal, smallest version

A fixer that changed evaluation count or lost a narrowing should exit non-zero, or emit a
warning, naming the file — the way a linter does when it cannot fix. Silent success is the one
outcome that makes a fixer worse than no fixer, because the code *looks* migrated.

Fuller version: `getLogical` could bind the receiver when it is a call, which is the common case
and has a safe answer. That is a fixer change, not a lint change, and belongs upstream.

### This rule is not about this repository either

`remove-duplicated-receiver` catches any `a() && a.b()`, whatever put the `&&` there — a `?.`
expansion in this repository, but a hand-written one, or a template, anywhere. There are no
filenames in it, no CSS tokens and no `ControlOrMeta` chords.

Its natural home is `@putout/plugin-logical-expressions`, whose five rules are all about the
shape of a logical expression: `simplify`, `remove-boolean`, `remove-duplicates`,
`convert-bitwise-to-logical`, `convert-coalescing-to-logical`. A duplicated receiver is the
same concern — `a && a.b` is a logical expression that evaluates one side twice. So it should
be moved there.

What is worth keeping in this repository until it lands is the lesson, because the rule exists
because of it: **a fixer that only reports has not done the thing.** This one was written
report-only first, on the reasoning that choosing a binding is a human call — which is eslint's
posture, and the one 🐊**Putout** exists to replace. Every defect it now catches, it fixes.

***

## 💡 `apply-type-check` fires on domain types too

It rewrites any `x.type === 'Y'` where `types['isY']` exists, and it cannot see types. In this
repository that broke `defaultESTreeParserInterface`, whose `AstNode` is the Editor's own
interface and not a babel `Node` — `isProgram(node)` does not compile. Reverted here, and it
is in `@putout/plugin-putout` now: the existence check is necessary but not sufficient, because
a domain type can share a name with a node type.
