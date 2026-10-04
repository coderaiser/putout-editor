# putout plugins

Rules in `packages/plugin-putout-editor` — the [README](../../packages/plugin-putout-editor/README.md)
has the ❌/✅ pair for each. `docs/plugins.md` is the guide for writing one.

| Rule                                 | Kind       | What it found                                                         | Finding |
|--------------------------------------|------------|-----------------------------------------------------------------------|---------|
| `apply-linked-pattern-value`         | code       | a pattern key with `__a__`, which matches nothing and exits 0          | [a replacement that only reports has not done the thing](#-a-fixer-that-cannot-detect-its-own-lossy-cases-exits-clean) |
| `apply-box-sizing-to-sized-element`  | filesystem | the chat composer, 40px wider than a phone; and one button in `mobile.css` | [one place per file, every selector fixed](#-matchfiles-reports-one-place-per-file-while-the-fix-reaches-every-match) |
| `apply-press-modifier-case`          | code       | six `ControlOrMeta+V` in the e2e specs, passing while meaning nothing | [fixers that lose a guard](#-apply-destructuring-drops-the--guard-on-a-return) |
| `check-documented-scripts`            | filesystem | docs naming `bun run` scripts that `package.json` does not have    | [`matchFiles` cannot answer a question about a second file](../plugins.md#matchfiles-cannot-be-made-to-work-for-check-documented-scripts) |
| `check-main-imports-in-file`         | filesystem | a rule in `main.css`, which is an entry point and holds only imports   | [a filesystem rule, and when it needs two files](../plugins.md#matchfiles-is-for-one-file-a-rule-that-compares-two-needs-scan) |
| `check-try-catch-destructure`       | code       | the `tryCatch` rewrite that throws on a real `package.json`             | [a rewrite that keeps the suite green](../memory/putout-rules.md#trycatch-returns-a-shorter-array-when-it-catches) |
| `hoist-arrow-callback`              | code       | an inline callback buries the predicate in the call                     | [report-only is possible](../plugins.md#report-only-is-allowed-and-it-costs-one-no-op-action) |
| `remove-comments`                    | code       | the `scripts/check-comments.js` gate, as a rule                       | [a fixer can simplify a rule into a different rule](#-a-fixer-can-simplify-a-rule-into-a-different-rule-and-every-test-still-passes), and [one comment reported twice](#-remove-comments-reports-one-comment-twice-when-it-sits-between-two-statements) |
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

## ❌ `remove-comments` reports one comment twice, when it sits between two statements

The rule's own `filter` asks three questions of a node — `leadingComments`, `trailingComments`,
`innerComments` — and a parser attaches a comment sitting *between* two statements to **both** of
them. The `include` list has `Statement` in it, so both statements report the same comment.

Minimum repro, in a directory where the rule is on (`packages/plugin-putout-editor`, whose
`.putout.json` sets `putout-editor/remove-comments: on` for `*.js`):

```js
const a = [
    1,
];

// between two
const b = 2;
```

**Got** — two places, one comment:

```
lib/__probeB.js
 1:0  error   A rule says what the code already says  putout-editor/remove-comments
 6:0  error   A rule says what the code already says  putout-editor/remove-comments
```

**Expected** — one. There is one comment in the file.

The control that settles it is the same comment **above** the first statement rather than between
two, which reports once — so the count follows the comment's position, not its number:

| Shape                                   | `remove-comments` places |
|-----------------------------------------|--------------------------|
| `// c` then `const a = 1;`               | 1                        |
| `const a = 1;` blank line `// c` blank line `const b = 2;` | 2          |

`lib/hoist-arrow-callback/index.js` reported `10:0` and `29:0` for its single comment on lines
25–28, and that pair is what put `putout .` on this branch to red: a file with one comment and two
errors reads as two problems, and `--fix` takes the comment away on the first one.

**The fix is not in the reporter, and that is the part worth keeping.** The count is only wrong; the
`fix` sets all three arrays to `[]`, so either report removes the comment and the second is a no-op.
A rule that over-reports is annoying; one that *under*-reports after a fix is dangerous, and this is
not that. So the duplicate is filed, and the comment in `hoist-arrow-callback/index.js` was deleted
rather than the rule taught to count — `AGENTS.md` says the plugin carries no comments, and the
README section for `hoist-arrow-callback` already says all of it ("A **destructured** parameter is
left alone too … the naming question belongs to the fixer"). The comment was a third copy of a
paragraph that exists twice already.

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

## `matchFiles` reports one place per file, while the fix reaches every match

Found while writing `apply-box-sizing-to-sized-element`, and it changed what two of its specs are
allowed to assert.

`matchFiles` reports a **file**, not a node. A stylesheet with two matching selectors produces
**one** place — while `fix` reaches **both**, and does so even at `fixCount: 1`:

```css
.input {
    box-sizing: border-box;
    width: 100%;
    padding: 12px 20px 18px;
}

.chat__thread {
    box-sizing: border-box;
    width: 100%;
    padding: 24px 20px;
}
```

**Expected** — two places, or a way to ask. **Got** — one, with both fixed.

So the rule's two specs are deliberately different, and the reason is written on them:
`two selectors are both fixed` asserts the **text**, and `one place per file` asserts the
**count**. Asserting the count at 2 would have been the natural thing to write and it would have
been wrong about a property of the operator, not of the rule.

**The generalisable half:** a spec that asserts a count is asserting the runner as much as the
rule, and the two are different subjects. Where a fixer is what a rule is for, the fixed text is
the assertion — the count is trivia that a future runner change would move.

### The part worth keeping

**Two false positives were found by measuring the whole tree, and both were the author's intent
written down.** `.shareInfo input` in `ShareDialog.css` is `width: calc(100% - 10px)` with
`padding: 5px` — the author subtracted the padding by hand, and `box-sizing: border-box` would
have made the input 10px *narrower* than they wrote. `.input__send` in `chat.css` is
`width: 46px; padding: 0`, which is a width with no padding at all — and was only caught because
a bare `0` comes back from this parser as an empty string, so the zero test has to accept the
empty form too.

Both are now `no report` fixtures. A rule that would have fired on either is a rule people
disable, and the cost of a false positive in a lint rule is much higher than a miss.

## ❌ `apply-type-check` can assign an identifier to itself

Found because it fired on this repository. CI's `fix:lint` ran `putout . --fix` over
`/home/coderaiser/happy-css`, and nine files stopped working.

The rewrite, as a diff — the "after" line is the whole finding:

```diff
-const isDeclaration = (node) => node.type === 'Declaration';
+const isDeclaration = isDeclaration;
```

That "after" is not a style mistake, it does not parse as working code: every one of those
is a `const` bound to itself, which throws the moment the module loads.

```
$ npx tape 'lib/parser/visitors/atrule/atrule.spec.js'
ReferenceError: Cannot access 'isDeclaration' before initialization
```

**Expected** — `isDeclaration(node)`, imported from `types`, which is what
`@putout/plugin-putout`'s rule of the same name does. **Got** — the identifier
**being declared on that very line**, substituted for the helper.

The rule sees `node.type === 'Declaration'`, knows a type check wants an `is*`
call, and finds `isDeclaration` in scope — because the file declares it two lines
up, as the very thing it is about to overwrite. It cannot know the two are the
same binding. `x = x` is not a worse style choice here; it does not parse as
working code.

**Nine files, and the Lint job auto-committed it as
`chore: happy-style: actions: lint ☘️`** — the `continue-on-error` behaviour
`MEMORY.md` records. So the repository was broken on `master` by a green step, and
the revert is `9c88918`.

The nine: `color-profile`, `counter-style`, `font-face`, `font-palette-values`,
`keyframes`, `page`, `property`, `view-transition`, `rule/rule` in the parser, plus
`css-import`, `get-number` and `keyframe-rule` in the printer. The last three got
the correct treatment — `isUnaryExpression` and `isStringLiteral` *are* real
exports, so the rewrite there is valid.

### The generalisable half

**A fixer that cannot tell a binding from its own name will eventually write one.**
This is the same shape as
[the `tryCatch` rewrite that throws on a real `package.json`](#-a-rewrite-that-keeps-the-suite-green)
and the [`apply-destructuring` guard loss](#-apply-destructuring-drops-the--guard-on-a-return):
a rewrite that is correct in the abstract and catastrophic on the instance it
meets. Two things make it survivable and neither is the rule being right:

- the suite runs **after** the lint in CI, which is why this was caught at all;
- `MEMORY.md`'s "when you fix something, move it" — a revert with the reason in the
  message is what stops the next person from re-running `--fix` and re-breaking it.

**A `js` fence in a markdown file is linted as real JavaScript** (`AGENTS.md`), so
this is reachable from documentation too — worth knowing before writing an example
of the shape the rule matches.

## 💡 a check that rejects a working rule, because it was written from the entry point and never read the runner

`flatlint_rule` answered `✗ has a match export … a match is putout's shape and is
ignored here` — for a language that **honours `match`**. An author following that
advice would have deleted a guard the engine runs.

This is not a rule of ours, so it has no row in the table above; it is the most
expensive kind of entry in this file, because it was a **tool that was wrong
rather than silent**.

### The minimum that reproduces it

```js
export const report = () => `Add missing '=>'`;

export const match = () => ({
    '(__args) {': (vars, path) => !isIdentifier(path.getPrev()),
});

export const replace = () => ({
    '(__args) {': '(__args) => {',
});
```

That is `lib/plugins/add-missing-arrow/index.js` from flatlint, verbatim. **Got:**
`ok: false`, with a message telling the author to remove the `match`. **Expected:**
`ok: true`.

### Where the claim came from

`docs/memory/flatlint.md` said *"there is no `match`"*, and it said it from having
read `lib/flatlint.js` — a nine-line `parse → run → print` — and never opened a
plugin. The runner answers it in one line, quoted verbatim — a `text` fence because a
`js` fence is linted as real JavaScript here and `optional-chaining` would demand
a rewrite of a quote that must stay exactly as it is:

```text
const match = plugin.match?.() || returns({});
```

Measured by importing every plugin and calling `match()` and `replace()`:
**14 of 33 plugins (42%) export `match`, 49 keys.** The same file had already
recorded an earlier version of itself saying flatlint has *"no `report`
concept at all"*, also from not opening a plugin. **Twice from the same omission,
on the same file, in opposite directions.**

### Why the check could not have caught it

The check read the **exports** — `report`, `replace`, `match` — and decided
correctness from the *presence of a name*. It never asked what the name means, so
it could only ever encode the belief it was written from. There was no fixture
carrying a `match`, and the one real fixture it did have,
`remove-useless-assign`, is a two-export plugin that looks **identical** under
both beliefs — so the whole suite stayed green while the tool rejected 42% of the
rules it was supposed to help write.

The replacement check reads the two maps and compares **keys**: a guard whose key
is absent from `replace` is dead, because the runner looks the guard up by the
replace key it is iterating. It is on the AST, since a key is a *pattern* —
`'(__args) {'` ends in a brace, and the brace-counting first attempt called a
fourteen-key plugin an empty one.

### The generalisable half

**"A check cannot be written from the name of a thing; it has to be written from
what the thing does."** Both halves of that were violated here — the claim came
from the entry point, and the check was written from the claim.

The pin that would have caught it costs one line: **feed the checker every rule
in the target codebase and assert none is rejected.** 33 files, one loop, and it
answers "is this tool fit for purpose" instead of "does this rule have three
exports". `docs/memory/flatlint.md` records the same trap for `report`; the
lesson is not flatlint-specific, it is that a doc which says a thing *cannot*
happen needs its evidence to be a measurement and not an omission.

## ✅ `validate` answered `ok` for a plugin the runner rejects — **closed**

The most expensive gap the mcp had, and the clearest instance of the lesson
[`../lessons.md`](../lessons.md) records: *a check that passes on a cheaper path
than the user takes*.

**The minimum**

```js
// mcp `validate`, before this commit
compilePlugin('export const report = () => "x";');
```

**What I got** — `ok`.

**What I expected** — a report that this is not a rule yet.

Because it compiles. `find_places` then answers `Looks like 'find' is not a
'function' but 'undefined'`, and `transform` the same for `fix`. The tool whose own
description says *"call this before calling find_places"* was green on precisely
the plugin that breaks `find_places`, so the round trip cost the user the error
and taught them that `ok` means more than it does.

`validate` now also checks the **shape** — `report` plus one of `fix`, `find`,
`traverse`, `replace`, `include`, `exclude`, `rules`, `declare`, `scan` — and
answers `plugin_shape: …` naming the keys and pointing at `find_places`. The list
is read off the compiled module, so it is judged on what the loader will find
rather than on how the plugin was typed.

**The other half is the direction that matters.** A shape check can be wrong by
*rejecting* a working rule, which is worse than the gap: the user is told their
traverser is broken when it is fine. So the spec enumerates one plugin per
accepted key and requires all of them to stay `ok`. That is the half that caught
the real mistake here — `fix` was missing from the first list, and the suite failed
on the existing `report` + `fix` test rather than on anything new.
