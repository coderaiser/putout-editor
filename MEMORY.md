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

Concretely: `tape/extract-result-from-assertion` stays on even though it misfires on a bare
`[]`, and the `js` fence language stays a real error. The right response to a gate is a
finding in `docs/issues/`, not an `.putout.json` entry or a lenient spec.

## Style, from the maintainer

- **Never use `try`/`catch`** in this codebase — `tryCatch` (sync) or `tryToCatch` (async)
  from `try-catch` / `try-to-catch`.
- **No comments in `.madrun.ts`.** Fine everywhere else.
- **Do not write imports that compile-rule auto-declares.** `remove`, `rename`, all `types`
  members, `getFilename`, `getFileType`, and other operator helpers are injected by
  `@putout/plugin-declare` at compile time. Writing them manually produces a duplicate
  declaration after the next `putout . --fix`.
- If `.madrun.ts` changes, run `madrun --init`; `--init` *deletes* `package.json` scripts it
  does not own, so check for collateral damage afterwards.
- **`.madrun.ts` is the source of truth for scripts**, not `package.json`.

## Re-check open findings

Findings marked `❌` are waiting on something landing. Before working on anything else,
check whether it has — a finding left open after its fix exists is stale documentation.

- **`docs/issues/markdown.md`** — `convert-js-to-ts` for `@putout/plugin-markdown` is
  prepared and verified but not landed. Check
  `node_modules/@putout/plugin-markdown/lib/` for a `convert-js-to-ts` directory, or the
  published version. Once it exists: mark the finding `✅`, cut the issue down to the
  resolution with a link to the rule, and drop the worked source and transform — the
  landed rule is the reference from then on.
- **`docs/issues/coverage.md`** — the client's 100% coverage gate excludes the twelve source
  paths that are uncovered, so the real figure is 98.15%. It is not waiting on an
  upstream fix; it is waiting on the tests for those files, listed per file in the
  finding. Re-check before quoting a coverage number for `packages/client`.
- **`docs/issues/tape.md`** — the `tape/apply-stub` import fix (a missing import when the
  rule introduces `stub`) and the `tape/extract-result-from-assertion` type emission
  (`const expected: typeof result = []`) both live in `eslint-plugin-putout`. Neither needs
  supertape type work: `@cloudcmd/stub@5.1.0` already declares `resolves<T>()`, and
  `supertape` re-exports it.

## Keep these three in step

`AGENTS.md` (facts about the code), `docs/` (map and findings) and this file (how the work is
done) go stale independently. **When you learn something worth keeping, update whichever
applies and commit it separately** — do not fold a doc fix into an unrelated code change, and
do not leave it only in a commit message. A fact belongs in the code as a comment at the thing
that owns it; a convention belongs here.

## Judgement calls

- Prefer a test or an assertion over a comment: a comment can be ignored, a throw cannot.
  `makeStore` rejecting overrides that `revive()` would discard is the model.
- **A gate satisfied by excluding what it does not cover is not a gate.** The client's
  100% coverage threshold was met by twelve `.nycrc.json` exclude entries naming exactly
  the uncovered files, so the number that had been quoted for months measured 123 files
  somebody had chosen. When you read a coverage config, an ignore list or a lint scope,
  check whether it is exactly the set that fails. And when you uncover that, do not
  commit the tightened gate red and do not lower it — land the measurement, write the
  finding with the real number, and say plainly that the remaining work is tests.
- Measure before restructuring. Three plans in this repo were wrong on inspection rather
  than on principle: a re-export kept "so no importer changes" that kept a cycle alive; a
  context moved out of `store/` that `boundaries/dependencies` forbids; a `reducers.ts`
  split predicted at 35 lines that came out at 290 because the slice is the bulk of it.
  Each was caught by a gate, which is the argument for writing the gate first.
- `finder` is advanced and the mcp must never suggest it — lead with replacer, then includer,
  then traverser. It stays available for users who name it explicitly, and it must still
  export `fix`: a `find` with no `fix` runs under `find_places` but throws in `transform`,
  which is the mode a user actually runs. The client template has always carried one; keep
  it that way.
- Put an invariant in a comment at the code that owns it, and a *map* in `docs/`. A comment
  costs nothing because you were opening that file anyway; a doc costs a deliberate read.
- Say plainly when something was **not** verified, and do not claim credit for a fix whose
  cause is unknown.
