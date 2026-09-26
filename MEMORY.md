# MEMORY.md

How this repo is worked on, agreed with the maintainer. The *facts about the code* are in
[`AGENTS.md`](./AGENTS.md) and [`docs/architecture.md`](./docs/architecture.md); this file is
the part that is not derivable from the tree.

## Commits

- **`type: scope: message`** — `docs: agents: …`, `feature: mcp: …`, `fix: client: …`,
  `refactor: templates: …`. This has been corrected once; follow it.
- **One logical change per commit.** Do not bundle a refactor with an unrelated doc update.
- **`docs/issues/` updates always get their own commit**, separate from whatever code change
  surfaced the finding.
- **Write the message to a file and use `git commit -F`.** A `-m` message containing
  backticks gets them eaten by the shell — a `js` fence marker in a `-m` string silently
  disappears.
- **Run `putout .` before committing, not after.** CI's Lint step is `redrun fix:lint` and
  then auto-commits whatever it changed, so unlinted code comes back as a surprise commit.

## Findings go in `docs/issues/`, one file per area

`tape.md` for tape/putout-lint problems, `markdown.md` for markdown. Check whether a new
finding belongs in an existing file before creating another.

Every finding carries, in this order:

1. the **minimum possible code that reproduces it**;
2. the **result you got** — a diff is best;
3. **what you expected**.

Two standing rules on those files:

- **Only report what you verified reproduces.** Unverified suspicions stay in the plan or in
  the commit message. If a repro could not be made minimal, say so.
- **A finding is a defect, not a disagreement with a design.** If the behaviour is by design,
  the issue records the agreed design and narrows to the real gap. `✅` resolved, `❌ open`.

## Rules are gates, not obstacles

When a lint rule or a test gate catches a mistake, fix the code — do not disable the rule or
widen the test. Proposed workarounds have been declined in favour of the gate.

Concretely: `tape/extract-result-from-assertion` stays on even though it mis-fires on a bare
`[]`, and the `js` fence language stays a real error. The right response to a gate is a
finding in `docs/issues/`, not an `.putout.json` entry or a lenient spec.

## Style, from the maintainer

- **Never use `try`/`catch`** in this codebase — `tryCatch` (sync) or `tryToCatch` (async)
  from `try-catch` / `try-to-catch`.
- **No comments in `.madrun.ts`.** Fine everywhere else.
- If `.madrun.ts` changes, run `madrun --init`; `--init` *deletes* `package.json` scripts it
  does not own, so check for collateral damage afterwards.
- **`.madrun.ts` is the source of truth for scripts**, not `package.json`.

## Judgement calls

- Prefer a test or an assertion over a comment: a comment can be ignored, a throw cannot.
  `makeStore` rejecting overrides that `revive()` would discard is the model.
- Put an invariant in a comment at the code that owns it, and a *map* in `docs/`. A comment
  costs nothing because you were opening that file anyway; a doc costs a deliberate read.
- Say plainly when something was **not** verified, and do not claim credit for a fix whose
  cause is unknown.
