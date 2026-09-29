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

## How this was measured

Three passes over the log, so a later reader can redo or disagree with it: commit messages by
prefix and body-emptiness; `git show --name-only` per commit for the hot-spot table; and
reading the body of every `fix:` commit whose summary alone did not explain the cause. The
first pass found the volume and the second the clusters, both counts. The third pass — the
five causes that came out of reading the commit bodies — is gone from this file, because its
rules now live with the code they govern; that pass is the only one that needed judgement, so
it is the one to distrust if it is ever redone.

What is left here is the evidence. The rules that came out of it are in
[`AGENTS.md`](../AGENTS.md) — *a check has to run the path the user runs*, and *nothing in a
template may depend on a rewrite the reader cannot see* — and the work it implies is in
[`ideas.md`](./ideas.md).
