# putout plugins

Rules in `packages/plugin-putout-editor` — the [README](../../packages/plugin-putout-editor/README.md)
has the ❌/✅ pair for each. `docs/plugins.md` is the guide for writing one.

| Rule                            | Kind       | What it found                                                         |
|---------------------------------|------------|-----------------------------------------------------------------------|
| `apply-press-modifier-case`     | code       | six `ControlOrMeta+V` in the e2e specs, passing while meaning nothing |
| `check-main-imports-in-file`    | filesystem | a rule in `main.css`, which is an entry point and holds only imports   |
| `remove-comments`               | code       | the `scripts/check-comments.js` gate, as a rule                       |
| `remove-rgb-outside-token-file` | filesystem | the one hardcoded colour outside `css/tokens.css`                     |
| `remove-undefined-token-file`   | filesystem | a `var(--x)` `tokens.css` never defined, so it rendered nothing        |
| `remove-z-index-outside-token-file` | filesystem | seven raw `z-index` numbers, now a `--z-*` scale                      |

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
call receiver and a bare logical expression. The first is upstream's
`logical-expressions/apply-destructuring`, which destructures the receiver in a declaration, a
return and a concise arrow body. The second is a report, because there is no safe automatic shape
for it.

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

A duplicated receiver is `a() && a.b()` whatever put the `&&` there — a `?.` expansion in this
repository, but a hand-written one, or a template, anywhere. There are no filenames in it, no CSS
tokens and no `ControlOrMeta` chords.

**Where it ended up: upstream, and it is already there.** `a && a.b` is a logical expression
that evaluates one side twice, which is the same concern as the rest of
`@putout/plugin-logical-expressions` — `simplify`, `remove-boolean`, `remove-duplicates`,
`convert-bitwise-to-logical`, `convert-coalescing-to-logical`. Its `apply-destructuring` covers
all three statement contexts and checks the name against the scope, so our copy was deleted
rather than kept as a near-duplicate. It has one defect of its own, filed above.

What is worth keeping from writing it is the lesson: **a fixer that only reports has not done the
thing.** It was written report-only first, on the reasoning that choosing a binding is a human
call — which is eslint's posture, and the one 🐊**Putout** exists to replace. Every defect it
caught, it fixed.

***

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

The same shape is already in this file twice: the `convert-optional-to-logical` fix that exits
clean on lossy cases, and the fence that `--fix` "corrected" until the example was gone. All
three are a fixer acting on something no check was watching, and all three are a missing
negative case. It is also a recurrence of cause #1 in
[`../lessons.md`](../lessons.md#1-a-test-passed-on-a-cheaper-path-than-the-user-takes) —
`remove-comments` passing every spec while firing on 50 places, and now the same rule passing
every spec while firing on files with nothing to report.

## ❌ `apply-destructuring` drops the `&&` guard on a `return`

Upstream, from `@putout/plugin-logical-expressions` — not a rule of ours, and this is what
replaced our own `remove-duplicated-receiver`.

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
[`markdown.md`](./markdown.md), and it is why `test/readme.js` exists to catch it when it
happens. Here it is shown as runnable input instead:

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
