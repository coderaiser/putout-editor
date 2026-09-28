# Ideas

**Not started yet, and worth starting.** An idea leaves this file when it is done, and the part
worth keeping about *how* goes to [`memory/`](./memory/); a finding that is being worked on is
in [`issues/`](./issues/). Three files, one job each, so nothing drifts:

| File | Holds |
|---|---|
| this one | an idea, not begun |
| [`issues/`](./issues/) | a problem, being fixed — the repro and the expected result |
| [`memory/`](./memory/) | what was learned, once the problem is closed |

**Append-only, and add without being asked.** `AGENTS.md` says an agent that notices something
broken adds an entry and says so. An idea with no evidence line is a guess — measure it first or
mark it as one.

| # | Idea | Size |
|---|---|---|
| 1 | Require a body on `fix:` | S |
| 5 | Review the hot-spot list monthly | S |
| 6 | Cut the CI auto-commit volume | M |

## 1. Require a body on `fix:`

**Evidence.** 84 of 123 `fix:` commits in 30 days have an empty body, against 18% for `docs`.
Two are bare summaries: `fix: client: editor-code: ReferenceError in editor-code` and
`fix: localStorage`. Nothing records why either happened.

**Why it pays.** A fix is the commit whose reason is needed longest. Six months on, an empty
body means re-deriving the bug from scratch — the token cost this repository keeps paying.

**How.** A `commitlint` rule, or a check in `Node CI` that fails a push whose latest `fix:`
commit is subject-only. Cheapest is a `.gitmessage` template with no CI; the CI version is the
one that actually holds.

## 5. Review the hot-spot list monthly

**Evidence.** [`lessons.md`](./lessons.md) names the eleven files, and five of them carry a
third of all `fix:`/`refactor:`/`feature:` touches.

**Why.** A regenerated list turns "this area is fragile" from a hunch into a number, and the
number is what makes an afternoon on it worth spending.

**How.** One command, appended to `lessons.md`. Cheap enough to actually do.

## 6. Cut the CI auto-commit volume

**Evidence.** 200 of 745 commits in 30 days are `chore: … actions: lint ☘️` — 27%. Re-measured
2026-09-27: 116 of 742 (15.6%), and only 6 in the last 7 days. The trend is improving on its
own, which is worth knowing before spending an afternoon on it.

**Why it pays.** Each is a review, a merge and a future conflict, and it is exactly the
signal-to-noise that makes a real fix easy to skim past. It is also *unreviewed work*: nothing
checked whether the fixer was right, which is how a rule here was reformatted by CI without
anyone deciding it should have been.

**How.** Two directions, both worth doing. Fewer changes — the `fix:lint` step is over-eager in
places, and [`memory/fence-gate.md`](./memory/fence-gate.md) records it stripping a rule's
own example. Or keep the changes and drop the commits: a rolling lint branch, or a PR instead of
a push.
