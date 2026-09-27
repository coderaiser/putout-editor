# What broke, and why

A month's worth of fixes read back for a pattern, so the next one is cheaper. Every number is a
count over `coderaiser/putout-editor` between **2026-08-28 and 2026-09-27** — 745 commits.
[`ideas.md`](./ideas.md) is what this turned into; this file is the evidence for it.

## The volume

| | Count | Share |
|---|---|---|
| commits | 745 | |
| CI auto-lint (`chore: … actions: lint ☘️`) | 200 | **27%** |
| `fix:` | 123 | |
| `refactor:` | 60 | |
| `feature:` | 130 | |

**A quarter of the history is a machine reformatting code someone had already written.** Each
one costs a review, a merge, and eventually a conflict. It is not work anyone chose to do.

## The why is missing

| Type | Commits | Empty body |
|---|---|---|
| `docs:` | 61 | 11 — **18%** |
| `feature:` | 130 | 110 — 85% |
| `refactor:` | 60 | 47 — 78% |
| `test:` | 105 | 92 — 88% |
| `fix:` | 123 | 84 — **68%** |

`docs` is the best-documented category in the repository and `fix` is close to the worst, which
is backwards: a fix is exactly the commit whose *reason* you need six months later. Two real
examples in the last month are a bare `fix: client: editor-code: ReferenceError in editor-code`
and a bare `fix: localStorage`. Nothing in the repository records why either happened, so
nothing prevents either from returning.

The habit is not missing — `docs` proves it. It is just not applied where it pays.

## Where the fixes land

Files touched by `fix:`/`refactor:`/`feature:`, 30 days:

| File | Touches |
|---|---|
| `packages/client/css/style.css` | 24 — since renamed `main.css`; `css/` is now 10 files |
| `packages/client/src/store/reducers.ts` | 13 |
| `packages/client/src/store/formatMiddleware.ts` | 11 |
| `packages/client/src/types/supertape.d.ts` | 10 |
| `packages/client/css/mobile.css` | 10 |
| `packages/mcp/src/server.ts` | 9 |
| `packages/mcp/src/examples.ts` | 8 |
| `packages/client/src/snippet/snippetMiddleware.ts` | 8 |
| `packages/client/src/ui/PasteDropTarget.tsx` | 7 |
| `packages/client/src/parser/parsers/index.ts` | 7 |
| `packages/client/e2e/mobile.ts` | 7 |

Five files carry a third of it. That is a list, not a coincidence.


## The five causes

### 1. A test passed on a cheaper path than the user takes

Five consecutive `fix: mcp` commits, all the same file, all the same class:

- `get_example` returned a `finder` example with `report` + `find` and **no `fix`**. A `find`
  with no `fix` is valid in the advanced finder mode and **throws** through `transform`, which is
  the normal runner. The specs could not see it: they compiled every example and ran
  `find_places`, and a fix-less plugin passes both.
- The `finder` example ended with `export const fix = …`, so following it produced a rule that
  was really an includer — which is how `convert-js-to-ts` ended up a mix of `include` +
  `filter` + `replace`.
- `replace()` was described without saying it is **unconditional**, so a rule that has to
  decide per match looked like it needed an includer.

Same shape, three weeks later, in the client: `remove-comments` passed its own 26 tests while
firing on 50 places in the repository, and `remove-duplicated-receiver` passed 39 while crashing
on its own source. The plugin's tests test the plugin.

> **Change:** a check has to run the path the *user* runs. Compile is not execute; `find_places`
> is not `transform`.

### 2. Code that only works because of a hidden rewrite

The scanner template shipped `fix = () => { path.remove(); }` with no parameter. It worked
because `compile-rule` injects the one. Copy it into a plugin that has not been through
`compile-rule` and `path` is a `ReferenceError`. The template taught working code by accident.

> **Change:** nothing in a template may depend on a rewrite the reader cannot see.

### 3. Debt taken as a shortcut, repaid in instalments

`@ts-nocheck` came off the `editor-ast-tree` directory over **three** separate commits
(`ad0bc73`, `ee8ee5d`, `b3fc926`), each a slightly different subset of files, each with a
slightly different summary. One commit, one directory, one reason.

> **Change:** a shortcut with a visible owner gets repaid. A shortcut nobody names is a queue
> of anonymous instalments.

### 4. One file absorbs everything

`css/style.css` took 24 fixes before being renamed `main.css` and split. The split is the right
outcome and it happened late — every one of those 24 fixes was a symptom of a file that had
grown past what a stylesheet should hold.

### 5. The barrel is also the thing it exports

`store/reducers.ts` is 13 fixes deep and is documented as being *both* the slice and the barrel
every other store file imports from. That is why it keeps growing: it is the default place to
put a type, so the types accumulate there. `architecture.md` already says the re-export exists
so `state.ts` and `revive.ts` can move independently — which is true, and also why the file is a
magnet.

## What this costs

The tax is not only the fixes. It is the **re-derivation**: 68% of fixes carry no reason, so the
next person — or the next agent — re-investigates from scratch. Five files cluster the work, so
the knowledge about them is concentrated in nobody's head. And a quarter of the commits are
reformatting, which is exactly the noise that makes a real fix easy to skim past in review.

## What actually made a fix fast

Worth recording, because it is the counter-example:

- **A rule that reproduces the defect.** `remove-undefined-token` found a dead
  `var(--color-selection-bg)` on its first run. No investigation — the rule *was* the
  investigation.
- **A failing test that names the mechanism.** "The specs could not see this: they compile every
  example and run `find_places`" is a one-line diagnosis that ends the search.
- **Measuring before fixing.** The 29 `tsc` errors from the `?.` conversion were counted, not
  guessed, which turned a vague "the fixer broke things" into "two of the three are catchable
  without types".

The common thread is that each one replaced a search with a command. That is the whole goal.

## How this was measured

Three passes over the log, so a later reader can redo or disagree with it: commit messages by
prefix and body-emptiness; `git show --name-only` per commit for the hot-spot table; and
reading the body of every `fix:` commit whose summary alone did not explain the cause. The
first pass found the volume, the second the clusters, the third the five causes — and the third
is the only one that needed judgement, so it is the one to distrust first.
