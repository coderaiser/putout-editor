# MEMORY.md

How this repo is worked on, agreed with the maintainer. The *facts about the code* are in
[`AGENTS.md`](./AGENTS.md) and [`docs/architecture.md`](./docs/architecture.md); this file is
the part that is not derivable from the tree.

## Commits

- **`type: scope: message`** — `docs: agents: …`, `feature: mcp: …`, `fix: client: …`,
  `refactor: templates: …`. This has been corrected once; follow it.
- **Never add a `Co-Authored-By` trailer, and never suggest one.** The commit is the
  maintainer's; an agent attribution line at the bottom is forbidden. Plain `git commit -F`
  and nothing else — if a template or an editor adds a trailer, strip it before committing.
  This has been corrected once already; follow it.
- **One logical change per commit.** Do not bundle a refactor with an unrelated doc update.
- **`docs/issues/` updates always get their own commit**, separate from whatever code change
  surfaced the finding.
- **Write the message to a file and use `git commit -F`.** A `-m` message containing
  backticks gets them eaten by the shell — a `js` fence marker in a `-m` string silently
  disappears.
- **Run `putout .` before committing, not after.** CI's Lint step is `redrun fix:lint` and
  then auto-commits whatever it changed, so unlinted code comes back as a surprise commit.

## Three files, three jobs — and a thing leaves when it is done

`docs/issues/` is **open problems only**. `docs/ideas.md` is **things not started**. `docs/memory/`
is **what was learned once a problem closed**, so the cause is not derived twice.

A resolved problem left in `issues/` is documentation that reads as if it were still broken, and
an implemented idea left in `ideas.md` is a backlog that lies about the work. That drift is why
`issues/qword.md` grew a resolved section next to an open one and the two contradicted each
other: the open half said the e2e suite could not run, the resolved half said it ran.

**When you fix something, move it.** The finding goes to `memory/` — trimmed to the cause and
the lesson, not the chronology. Keep the repro if re-deriving it would cost an hour; drop it if
the fix makes it obvious.

`memory/` is where a new fact goes when it is not a bug and not a task: the
[pattern grammar](docs/memory/putout-patterns.md) is the current example.

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

**And when the gate itself is the problem, that is an idea, not a workaround.** A fixer that
cannot fix, a message that does not locate its target, a rule that only runs in a mode nobody
runs — file it in `docs/issues/putout-plugins.md` and let it become a rule. Sitting on a known
gap because fixing it properly is upstream's job is how the gap survives: the fence-language
gate sat behind a "✅ verified" that had checked a hand-written copy rather than the rule, and
the css gate sat behind a CI step running an empty script.

**Say what is actually wrong, not a story about it.** Four findings here were wrong for a
while, each describing a mechanism that did not hold:

- a paste event aimed at the wrong target — disproved by instrumenting the browser;
- a rule that "cannot exist" — disproved by reading `check-match`;
- a `.putout.json` `off` form that supposedly silences nothing, twice over.

The third is the one to remember, because **the same measurement was wrong twice in opposite
directions** and both times the setup, not the subject, was at fault. First a probe whose shell
quoting failed, so no config was ever written and every form looked like it worked. Then, after
correcting it, a probe that ran against a README whose ❌ fence had *already* been stripped by
the fixer — so there was nothing to report and every form "passed" again. The first conclusion
was the right one, arrived at for the wrong reason, and the second nearly overwrote it.

Two rules follow, and they are the same rule: **before a measurement means anything, assert that
the thing being measured is in the state you think it is.** A probe that writes a file must check
the file changed; a probe that asks whether a rule is silenced must check the rule has something
to report. Otherwise the result is a measurement of nothing, and it will look like a finding.

When a claim rests on a hand-written copy, a summary, or a script, check the thing itself.

## Style, from the maintainer

- **Never use `try`/`catch`** in this codebase — `tryCatch` (sync) or `tryToCatch` (async)
  from `try-catch` / `try-to-catch`.
- **No comments in `packages/plugin-putout-editor`, ever.** The plugin is the documentation: a
  rule is named for what it does, and its README section says why. One exception that cannot
  be honoured — `remove-comments` reports `leadingComments`, `trailingComments` and
  `innerComments`, so its fixture and its ❌ example *are* comments. A comment-free example of
  that rule is a comment-free example of nothing.
- **Never move a message out to a variable.** `t.report('x', 'the message')` inlines it; a
  `const REPORT = …` is one more thing to keep in step and says nothing the call does not.
- **Never inline an array-method callback.** `.filter((name) => …)` hides what is being
  selected. Name it: `const notRejected = (name) => …` then `.filter(notRejected)`.
- **One-line consts go together after the imports.** A multi-line one stays with the code it
  serves.
- **A spec says what a rule does, not what it reports.** If a rule fixes, every shape it claims
  to fix is `t.transform` against its own fixture — `t.reportCode` cannot see a fix at all. A
  fixture with **no `-fix` twin** is a no-transform case, which is the
  `@putout/plugin-logical-expressions` convention.
- **No comments in `.madrun.ts`.** Fine everywhere else, apart from the plugin above.
- **Do not write a run of consecutive `//` lines.** CI's `putout . --fix` inserts a blank line
  between each of them, turning a wrapped comment into a column of one-line paragraphs — seen
  arriving as `chore: putout-editor: actions: lint ☘️` (1ae0f3a), on a comment block that
  `putout .` in report mode had said nothing about. Put the explanation in one long line, or in
  a block above the code.
- **Do not write imports that compile-rule auto-declares.** `remove`, `rename`, all `types`
  members, `getFilename`, `getFileType`, and other operator helpers are injected by
  `@putout/plugin-declare` at compile time. Writing them manually produces a duplicate
  declaration after the next `putout . --fix`.
- If `.madrun.ts` changes, run `madrun --init`; `--init` *deletes* `package.json` scripts it
  does not own, so check for collateral damage afterwards.
- **`.madrun.ts` is the source of truth for scripts**, not `package.json`.
- **A rule name is a claim about what it checks.** `css-architecture` claimed far more than the
  rule did and became `check-main-imports-only`; `apply-type-check` was not ours at all. If the
  name cannot be read as the check, it is the wrong name or the wrong scope.
- **`report` is the first export of a rule.** 603 of the 622 rule files in the 🐊**Putout** repo
  that export a plain `report` open with it, and the destructured form puts it first too. It is a
  convention with no lint rule behind it, which is exactly why it drifts — three rules here had
  `export const {scan, fix} = matchFiles(…)` first and the message last, because that is where
  the destructured result lands once written that way.
- **A `.putout.json` `off` has to be checked, not assumed.** `"putout-editor": "off"` in a
  `*.md` match covers every rule of the plugin and survives one being added, which is why it is
  the form to use — but it does not reach another plugin, so `logical-expressions/apply-destructuring`
  still needs naming alongside it. A ❌ fence is matched by every rule that dislikes the
  construct, not only the one its section is about.
- **A measurement whose setup was not verified is not a measurement.** I once recorded the
  package-level and wildcard `off` forms as inert; the probe's shell quoting had failed, so no
  config was ever written. The rule for this repo: if a probe writes a file, assert the file
  changed before believing what the run says.

## Re-check open findings

Findings marked `❌` are waiting on something landing. Before working on anything else, check
whether it has — a finding left open after its fix exists is stale documentation. There are
two, and they are in [`docs/issues/`](./docs/issues/index.md).

- **`docs/issues/build.md`** — `nest build` in `packages/server` reports 279 errors that
  `tsc --noEmit` does not. Re-check by running `npx tsc --noEmit` and `npx nest build` in that
  workspace and comparing the two counts, not by reading this line. **Not** the lock file: no lock
  is committed here, on purpose — `*.lock` is gitignored, CI installs with `bun i -f --no-save`, and
  the last one was removed in `bd8bc9d`. An entry that read that as an unpinned gap is gone; do not
  re-file it.
- **`docs/issues/putout-plugins.md`** — two upstream fixers exit clean on lossy cases, and
  `apply-destructuring` drops a `&&` guard on a `return`. Re-check upstream for a release
  that reports rather than fixes silently, not by running the fixer.
- **`docs/issues/scripts.md`** — the three scripts `AGENTS.md` told every agent to run were not at
  the root. Now added, and `check-documented-scripts` keeps the docs and `package.json` in step.
- **`packages/plugin-putout-editor/lib/check-documented-scripts`** — a rule in this repo, and its
  traps are reusable. `getFilename` is **absolute** under `redlint` — `/home/you/repo/AGENTS.md`,
  not `/AGENTS.md` — so strip it with `basename` and not `replace(/^\//, '')`; it reported nothing
  on this repository while all 194 tests passed. And `crawlFile(root, ['package.json', ...])`
  matches every `package.json` in the tree, so pick the one that is a **sibling** of the document
  by `dirname`, not the first. It cannot be a `matchFiles` rule: it asks what `package.json`
  declares, and the inner plugin provably gets `{"optionKeys":[]}` — no root, no `trackFile`. It
  takes `crawlFile(root, [PACKAGE, ...DOCS])` in one call; do not put `trackFile` in an
  `Array.from`, it is a generator. All three present as a rule that reports zero places and looks
  correct. **The mask is not the suspect** — `findFile` matches `value === name` or the regexp
  against the basename, so `tokens.css` finds an absolute `tokens.css` and
  `remove-undefined-token-file` works on the real tree. Check what the rule does with the path.
- **The template-value grammar is documented upstream — read it, do not probe it.**
  [`putout-script.md`](https://github.com/coderaiser/putout/blob/master/docs/putout-script.md)
  and [`@putout/compare`](https://github.com/coderaiser/putout/tree/master/packages/compare#supported-template-variables)
  list every value: `__` is any node, `__a` is any node and linked, and `__args`, `__object`,
  `__array`, `__imports`, `__exports`, `__args__a`, `"__a"` and `/__a/` each mean something
  specific. I spent this session probing it instead and published a wrong table, twice. The
  synthesis is in [`docs/putout-style.md`](./docs/putout-style.md#pattern-strings).
- **`enter`/`exit` do not work in a rule's `traverse`, and `$` and `*` are worse.** The runner
  drops them, silently: a rule using `enter` reports nothing and looks correct. What works is an
  includer over babel **aliases** (`Statement`, `Expression`, `ObjectProperty`), or a `Program`
  visitor calling the raw `traverse` imported from `putout`. Measured, in
  [`docs/memory/putout-rules.md`](./docs/memory/putout-rules.md) — read it before writing a rule
  that has to visit nodes it cannot name by hand.
- **An includer's `fix` receives a bare `path`, not `{path, key}`.** Reading it the traverse way
  reports every place, fixes none, and exits 0.
- **`UPDATE=1` is destructive in `plugin-putout-editor`** — it deletes `-fix` fixtures belonging
  to *other* rules. Generate a twin by running the rule and writing its `code`.

## Keep these three in step

`AGENTS.md` (facts about the code), `docs/` (map and findings) and this file (how the work is
done) go stale independently. **When you learn something worth keeping, update whichever
applies and commit it separately** — do not fold a doc fix into an unrelated code change, and
do not leave it only in a commit message. A fact belongs in the code as a comment at the thing
that owns it; a convention belongs here.

## Judgement calls

- Prefer a test or an assertion over a comment: a comment can be ignored, a throw cannot.
  `makeStore` rejecting overrides that `revive()` would discard is the model.
- **A glob that matches nothing is not a bug in the runner.** supertape exits 0 and prints
  nothing when a pattern matches no files, and a fix that made it fail was tried and
  reverted: a repo's own test globs legitimately match nothing until the files are added, so
  failing on it punishes the wrong moment. Do not re-propose it without being asked.
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
