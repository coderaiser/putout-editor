# putout plugins

Rules in `packages/plugin-putout-editor` — the [README](../../packages/plugin-putout-editor/README.md)
has the ❌/✅ pair for each. `docs/plugins.md` is the guide for writing one.

| Rule                                 | Kind       | What it found                                                         | Finding |
|--------------------------------------|------------|-----------------------------------------------------------------------|---------|
| `apply-linked-pattern-value`         | code       | a pattern key with `__a__`, which matches nothing and exits 0          | [a replacement that only reports has not done the thing](#-a-fixer-that-cannot-detect-its-own-lossy-cases-exits-clean) |
| `apply-press-modifier-case`          | code       | six `ControlOrMeta+V` in the e2e specs, passing while meaning nothing | [fixers that lose a guard](#-apply-destructuring-drops-the--guard-on-a-return) |
| `check-documented-scripts`            | filesystem | docs naming `bun run` scripts that `package.json` does not have    | [`matchFiles` cannot answer a question about a second file](../plugins.md#matchfiles-cannot-be-made-to-work-for-check-documented-scripts) |
| `check-main-imports-in-file`         | filesystem | a rule in `main.css`, which is an entry point and holds only imports   | [a filesystem rule, and when it needs two files](../plugins.md#matchfiles-is-for-one-file-a-rule-that-compares-two-needs-scan) |
| `check-try-catch-destructure`       | code       | the `tryCatch` rewrite that throws on a real `package.json`             | [a rewrite that keeps the suite green](../memory/putout-rules.md#trycatch-returns-a-shorter-array-when-it-catches) |
| `hoist-arrow-callback`              | code       | an inline callback buries the predicate in the call                     | [report-only is possible](../plugins.md#report-only-is-allowed-and-it-costs-one-no-op-action) |
| `remove-comments`                    | code       | the `scripts/check-comments.js` gate, as a rule                       | [a fixer can simplify a rule into a different rule](#-a-fixer-can-simplify-a-rule-into-a-different-rule-and-every-test-still-passes) |
| `remove-rgb-outside-token-file`      | filesystem | the one hardcoded colour outside `css/tokens.css`                     | [report-only is possible](../plugins.md#report-only-is-allowed-and-it-costs-one-no-op-action) |
| `remove-undefined-token-file`        | filesystem | a `var(--x)` `tokens.css` never defined, so it rendered nothing        | [a `scan` delegates to a matcher](../memory/putout-rules.md#a-scan-can-still-delegate-to-a-matcher) |
| `remove-z-index-outside-token-file`  | filesystem | seven raw `z-index` numbers, now a `--z-*` scale                      | [report-only is possible](../plugins.md#report-only-is-allowed-and-it-costs-one-no-op-action) |

The `Finding` column is why this file exists as a table and not as prose: a rule's *history* is
the reason it is on, and a reader who lands on the rule should be able to follow it in one
click. `apply-type-check` is the one thing here that is not a rule of ours and has no row —
it is [below](#-apply-type-check-fires-on-domain-types-too).

Not a rule, and the reason a fixer that works is still worth arguing about:
[a fixer that cannot detect its own lossy cases exits clean](#-a-fixer-that-cannot-detect-its-own-lossy-cases-exits-clean).

A **code** rule sees one file and runs under `putout .`. A **filesystem** rule is about a tree
and runs under `redlint`, because a 🐊**Putout** rule knows nothing about filenames. Both are in
`packages/client`'s `fix:lint`, so CI enforces them with no extra step.

`docs/plugins.md` is the guide for writing one — including the `matchFiles`-or-`scan` decision,
what report-only costs, and the shape of a filesystem rule. What the rules that already work
taught is in [`../memory/putout-rules.md`](../memory/putout-rules.md).

## 💡 a fixer that cannot detect its own lossy cases exits clean

`apply-linked-pattern-value` is the same failure in miniature, and it is now a rule: a pattern
key written `__a__` binds nothing, so it matches zero places and a replacement written the same
way emits the source back unchanged. It reports, it exits 0, and it fixed nothing. One
underscore is a linked value, so the fix is always safe.

`convert-optional-to-logical` is net-positive and would not be turned off — but it exits 0 on
code it has made type-unsound, and the type checker is what finds out. **The rule works, the
report is missing.**

**Before.** `export const parse = (state) => getParseResult(state)?.ast;` and
`export const label = (el) => el().text?.trim();`

**After `putout . --fix`.** Note `el()` is now called twice, and it is a call:

```
export const label = (el) => el().text && el().text.trim();
export const parse = (state) => getParseResult(state) && getParseResult(state).ast;
```

**Expected.** The receiver bound once, or a report that the fix is lossy.

**Got** — a clean exit, and then `tsc`, which is the only thing that noticed:

```
a.ts(5,45): error TS2531: Object is possibly 'null'.
```

`?.` narrows a type and `x && x.y` does not, so the conversion is type-preserving only if
something re-establishes the narrowing, and a rule cannot: it sees one AST and no types. One
`--fix` over ~60 files here cost **29 `tsc` errors**, **2 sites rewritten into code that does
not parse** (a `?.` on a multi-line TS cast) and **9 bare expressions** where
`onToggle && onToggle();` tripped `no-unused-expressions`.

**Proposal.** A fixer that changed evaluation count or lost a narrowing should exit non-zero or
warn, naming the file, the way a linter does when it cannot fix. Silent success is the one
outcome that makes a fixer worse than no fixer, because the code *looks* migrated. Fuller
version: `getLogical` could bind the receiver when it is a call, which is the common case and
has a safe answer — a fixer change, and it belongs upstream.

**Not about this repository either.** A duplicated receiver is `a() && a.b()` whatever put the
`&&` there. The rule ships `off` by default, which is the right posture for a fixer whose blind
spot is invisible; the missing piece is not the default, it is that nothing says the blind spot
was hit.

## 💡 `apply-type-check` fires on domain types too

It rewrites any `x.type === 'Y'` where `types['isY']` exists, and it cannot see types. In this
repository that broke `defaultESTreeParserInterface`, whose `AstNode` is the Editor's own
interface and not a babel `Node` — `isProgram(node)` does not compile. Reverted here, and it
is in `@putout/plugin-putout` now: the existence check is necessary but not sufficient, because
a domain type can share a name with a node type.

## 💡 a fixer can simplify a rule into a different rule, and every test still passes

`putout . --fix` removed the inner `for` from `remove-comments`:

```diff
-            comments.map(() => push({
-                path,
-                key,
-            }));
+            for (const comment of comments) {
+                push({
+                    path,
+                    key,
+                });
+            }
```

`for-of/remove-useless` was right — the loop variable was unused. The fix was to drop the loop
entirely, and what was left pushed once per comment **key** rather than per comment.

**Got.** 6 places on a file with comments, and **6 on a file with none**. **Expected.** 0 on a
file with none. Every test passed, because every test ran code that had comments.

**This is the highest-value kind of bug in this file**, and it is not a putout bug to file
upstream: the fixer did exactly what it was asked. The gap is that no test asked the negative
question. A rule that reports needs a fixture with nothing to find and a `t.noReport`, because
without one "reports too much" and "reports nothing" are the same green — and a CI auto-commit
that changes a rule is indistinguishable from one that does not.

The same shape is in this file twice more: the `convert-optional-to-logical` fix that exits
clean on lossy cases, and the fence that `--fix` "corrected" until the example was gone. All
three are a fixer acting on something no check was watching. It is a recurrence of *a check that
passed on a cheaper path than the user takes* in [`../../AGENTS.md`](../../AGENTS.md).

## ❌ `apply-destructuring` drops the `&&` guard on a `return`

Upstream, from `@putout/plugin-logical-expressions` — not a rule of ours. This is the rule that
replaced the one this package used to carry, so it is now what runs over this repository.

**Before.**

```js
const label = (el) => el().text && el().text.trim();
```

**After `putout . --fix`.**

```js
const label = (el) => {
    const {text} = el();
    
    return text.trim();
};
```

**Expected.** Keep the guard: `const {text} = el(); return text && text.trim();`. **Got** — the
`&&` is gone, and with it the only thing making a null receiver safe. The raw output has an
extra nested block too, which `--fix` then flattens with `remove-nested-blocks`; the guard is
already gone by then.

The rule takes the declaration and arrow forms correctly. Only the `return` template drops the
guard:

```js
const template = {
    'return __a().__b && __a().__b.__c()': `{
        const {__b} = __a();
        return __b.__c();
    }`,
};
```

**Why the repro below is inline and not fenced:** the `Before` and `After` blocks are exactly
what `logical-expressions/apply-destructuring` rewrites, and a `js` fence demonstrating a rule's
output is valid code that the fixer is asking to change — the example's purpose and the fixer's
job are opposed, and the fixer wins. That is the argument in
[`../memory/fence-gate.md`](../memory/fence-gate.md). Here it is shown as runnable input
instead:

```js
const el = () => ({
    text: null,
});

const before = (el) => el().text && el().text.trim();

const after = (el) => {
    const {text} = el();
    
    return text.trim();
};

console.log(before(el));
console.log(after(el));
```

The first line prints `null`; the second throws:

```
null
TypeError: Cannot read properties of null (reading 'trim')
```

There is no occurrence of the shape in this repository, so nothing here is broken by it. It is
reported because a fixer that turns a returned `null` into a thrown `TypeError` exits 0, and
that is the same gap as `convert-optional-to-logical` above: **the rule works, the report is
missing.** The declaration form cannot lose a narrowing, but a `return` can lose a guard, and
the template does not distinguish the two.

## 🐊 `check-documented-scripts` never matched a file: `redlint` builds absolute paths

**Fixed.** Recorded because the shape of it is the reusable part: a rule that is green on every
fixture and silent on the real tree, with no error anywhere.

### Minimum repro

From the repository root, with the rule enabled by the `.filesystem.json` match:

```
$ printf '\nRun `bun run definitely-not-a-real-script` now.\n' >> AGENTS.md
$ redlint scan
- putout-editor: check-documented-scripts
✔ putout-editor: check-documented-scripts
```

### Got

Zero places, for a script that does not exist. The same was true before the `crawlFile` reshape,
so this is not a regression from it.

### Expected

```
☝️ AGENTS.md: documents scripts that do not exist: definitely-not-a-real-script
```

### Why

Two bugs, and each one alone is enough to report nothing.

**1. `getFilename` is absolute under `redlint`, not `/`-rooted.** The rule stripped a leading slash
and compared the rest against `['AGENTS.md', 'MEMORY.md']`:

```js
const bareName = (file) => getFilename(file).replace(/^\//, '');
```

But `buildTree` in `@putout/redlint/lib/redlint.js` walks from `cwd`, so every filename is a full
path. Over the real tree:

```
/home/coderaiser/putout-editor/AGENTS.md
    bareName="home/coderaiser/putout-editor/AGENTS.md" isDoc=false
```

`isDoc` is false for **all seven** files the rule finds, and the loop body never runs.
`basename(getFilename(file))` is the fix.

**2. `package.json` matches every package.** A mask is matched against `basename` as well as the
full path, so `crawlFile(root, ['package.json', ...])` returns all five `package.json` in this
repository and `files.filter(isPackage)[0]` is `packages/client/package.json` — the root
`AGENTS.md` was being checked against the *client's* scripts. The rule now takes the `package.json`
that is a **sibling** of the document, by `dirname`. Three of the root's scripts (`start:dev`,
`report`, `gen:diagrams`) exist in no package but the root's, so this was a false positive waiting
for any document that mentioned one.

### The part worth keeping

**Both were invisible to the tests, because the tests build the tree.** Every fixture went through
`parseFilesystem(['/', ...files])`, which produces root-relative paths under `/` and exactly one
`package.json`. So the suite exercised the matcher against a tree shaped the way the rule wanted it,
and never the shape the runner produces. 194 tests, 100% coverage, and a rule that had never once
run.

The two regression tests are named for the shape rather than the behaviour —
`an absolute path, as redlint builds it` and `the nearest package.json wins` — and both were checked
to **fail** against the old code before being believed. A fixture written by hand is a fixture that
can be wrong in the same way twice; the second one is `buildTree(process.cwd())`.

## ❌ `packages/mcp` coverage gate is below 100, and it is not from this change

**Open.** Found while extracting the shared MCP content envelope, and confirmed pre-existing by
stashing the work and re-running at `HEAD`: `tester.ts` reports **92.3%** of functions, and the
package gate fails on `functions (98%)`. So `bun run check` does not currently pass for `mcp`, and
CI is either not running it or tolerating it.

The uncovered function is `printValue`, the replacement callback in `finder()` — a matcher built
for `putoutAsync` with `fix: false`, whose `replace` map nothing ever calls.

I did not fix it, deliberately. Removing the `replace` breaks 6 tests, so it is reachable; covering
it needs a spec that runs a *transform* against the finder plugin, which is a real behaviour and not
a contrived one — but it is a separate piece of work from a refactor that was supposed to be
behaviour-preserving, and folding it in would make that refactor's diff untestable.

What it means: **do not trust `packages/mcp` coverage as evidence that the package is at 100.** It
was not, before this work, and nothing in the repo says so.
