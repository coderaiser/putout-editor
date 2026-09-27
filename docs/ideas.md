# Ideas

A backlog, not a to-do list. **Append-only**, newest last, and an idea leaves here by being
either done or explicitly rejected — with the reason, so it does not come back.

Every entry carries the evidence that produced it, because the point of the file is that the
next person does not re-derive it. [`lessons.md`](./lessons.md) is where the measurements come
from; this is what they imply.

**An agent or contributor that notices something broken adds an entry here and says so, rather
than waiting to be asked.** That is the convention in `AGENTS.md`, and this file is where the
result lands. An idea with no evidence line is a guess — measure it first or mark it as one.

| # | Idea | Size | Status |
|---|---|---|---|
| 1 | Require a body on `fix:` | S | open |
| 2 | Run every `get_example` through `transform`, not just `find_places` | S | partly done |
| 3 | Collapse `supertape.d.ts` to a wildcard | — | **rejected** |
| 4 | Split the store barrel from the store slice | M | open |
| 5 | Review the hot-spot list monthly | S | open |
| 6 | Cut the CI auto-commit volume | M | open |
| 7 | Teach the fences to run, not just be linted | M | open |
| 8 | Generate the architecture diagrams | M | open |
| 9 | Give the parser subpaths real types upstream | S | open |

## 1. Require a body on `fix:`

**Evidence.** 84 of 123 `fix:` commits in 30 days have an empty body, against 18% for `docs`.
Two are bare summaries: `fix: client: editor-code: ReferenceError in editor-code` and
`fix: localStorage`. Nothing records why either happened.

**Why it pays.** A fix is the commit whose reason is needed longest. Six months on, an empty
body means re-deriving the bug from scratch — the token cost this repository keeps paying.

**How.** A `commitlint` rule, or a check in `Node CI` that fails a push whose latest `fix:`
commit is subject-only. Cheapest is a `.gitmessage` template with no CI; the CI version is the
one that actually holds.

## 2. Run every `get_example` through `transform`

**Evidence.** `fix: mcp: examples: finder plugin needs a fix to be runnable` — the example
threw `Looks like 'fix' is not a 'function'` for anyone who followed it, and the specs could not
see it because they ran `compile` and `find_places`.

**Status.** Done for the finder example. The general form is not: nothing runs *every* example
through `transform`.

## 3. Collapse `supertape.d.ts` to a wildcard

**Evidence.** `src/types/supertape.d.ts` is 9 `declare module` lines, one per
`@putout/engine-parser/*` subpath. It was 4 lines 30 days ago, so it grows with every parser
added, and it has been touched 10 times.

**Rejected, and do not re-propose.** Both forms were tested:

```
declare module '@putout/engine-parser/*';
declare module '@putout/engine-parser/*' { const mod: any; export = mod; }
```

Both fail with `TS2664: Invalid module name in augmentation` — TypeScript reads a wildcard as
an *augmentation* of a module that must exist, not an ambient declaration. The 9 lines are
irreducible **locally**. The fix is idea 9.

## 4. Split the store barrel from the store slice

**Evidence.** `store/reducers.ts` is the second most-touched file in 30 days (13) and is
documented as being *both* the slice and the barrel every other store file imports from.

**Why it keeps growing.** It is the default place to put a type, so the types accumulate. The
re-export earns its keep — it is what lets `state.ts` and `revive.ts` move without touching an
importer — and it is also why the file is a magnet.

**How.** A separate `store/index.ts` barrel, and `reducers.ts` goes back to being only the
slice. Mechanical, and `no-runtime-import-cycles` is the gate.


## 5. Review the hot-spot list monthly

**Evidence.** `lessons.md` names the eleven files, and five of them carry a third of all
`fix:`/`refactor:`/`feature:` touches.

**Why.** A regenerated list turns "this area is fragile" from a hunch into a number, and the
number is what makes an afternoon on it worth spending.

**How.** One command, appended to `lessons.md`. Cheap enough to actually do.

## 6. Cut the CI auto-commit volume

**Evidence.** 200 of 745 commits in 30 days are `chore: … actions: lint ☘️` — 27%.

**Why it pays.** Each is a review, a merge and a future conflict, and it is exactly the
signal-to-noise that makes a real fix easy to skim past. It is also *unreviewed work*: nothing
checked whether the fixer was right, which is how `remove-duplicated-receiver` got reformatted
by CI without anyone deciding it should be.

**How.** Two directions, both worth doing. Fewer changes — the `fix:lint` step is over-eager in
places, and `AGENTS.md` already records it rewriting a markdown fence into nonsense. Or keep the
changes and drop the commits: a rolling lint branch, or a PR instead of a push.

## 7. Teach the fences to run, not just be linted

**Evidence.** Three times in one session a `js` fence failed the lint — the rule-name lists, the
directory tree, the ❌ examples — and each time the tempting fix was to change the *documentation*
so it would satisfy the *rule*. The putout repo's answer is a `*.md` block in `.putout.json`,
which this repository now does too.

**Why it pays.** Every workaround is a small lie in the docs, and a reader cannot tell which
part of a document is example and which is prose.

**How.** `markdown/apply-ts-codeblock-in-file` is a filesystem scanner that only checks the fence
*language*. Upstream, a rule that runs the fence would end this class of workaround entirely.
Until then the `*.md` block is the honest answer and should be the default.

## 8. Generate the architecture diagrams

**Evidence.** The client diagram has 17 elements and 40 edges, hand-drawn from
`config/boundaries-config.ts`, and nothing checks it.

**How.** A `scripts/gen-diagrams.mjs` writing between `<!-- gen:name -->` markers, plus a check
that regenerates in memory and diffs — **the check is the gate, the generator is a convenience**.
The putout counts cannot be regenerated in CI (no checkout of the sibling repo), so those go in
a dated snapshot that the check validates the doc against.

**Blocked on.** `config/boundaries-config.ts` default-exports an eslint config *array* and
inlines the map. Export the map first.

## 9. Give the parser subpaths real types upstream

**Evidence.** 9 `declare module` lines for `@putout/engine-parser/*`, growing one per parser,
touched 10 times in 30 days, and irreducible locally (idea 3).
**Why it pays.** Every one of those subpaths is `any`, so a type error *inside* a parser is
invisible to this repository. That is a real blind spot, and a local shim never shrinks it.

**How.** An issue against the parser, with the argument: the client type-checks against nine
`any` modules on every run and cannot see inside any of them.
