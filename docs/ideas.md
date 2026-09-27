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
| 2 | Run every `get_example` through `transform`, not just `find_places` | S | **done** |
| 3 | Collapse `supertape.d.ts` to a wildcard | — | **moot — closed by 9** |
| 4 | Split the store barrel from the store slice | M | **done — it was inverted** |
| 5 | Review the hot-spot list monthly | S | open |
| 6 | Cut the CI auto-commit volume | M | open |
| 7 | Teach the fences to run, not just be linted | M | **item 1 done, 2 and 3 open** |
| 8 | Generate the architecture diagrams | M | **done for the client graph** |
| 9 | Give the parser subpaths real types upstream | S | **done upstream** |

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

**Done.** `examples.spec.ts` now runs **all 7** examples through `transform` against their own
fixture and fails on any output starting with `Error:`. It is the mode a user runs, and the mode
the other two checks do not.

The property pinned is "runs without throwing", not a per-pattern output — a hand-written
expected string per pattern is the `get_example` drift all over again, and the markdown example
already drifted that way once. The message names the pattern, so a failure says *which* example
is unrunnable:

```
finder: Error: ☝️ Looks like 'fix' is not a 'function' but 'undefined' with value: 'undefined'.
```

Verified by deleting `export const fix` from the finder example: the new test fails, and the two
pre-existing blanket checks — `compiles` and `find_places` — still pass it. That is the whole gap
in one run.

## 3. Collapse `supertape.d.ts` to a wildcard

**Evidence.** `src/types/supertape.d.ts` was 9 `declare module` lines, one per
`@putout/engine-parser/*` subpath. It was 4 lines 30 days ago, so it grew with every parser
added, and it had been touched 10 times.

**Do not re-propose, in any form.** Two reasons, and the second is the one that matters:

1. Both wildcard forms were tested and both fail with `TS2664: Invalid module name in
   augmentation` — TypeScript reads a wildcard as an *augmentation* of a module that must exist,
   not an ambient declaration.
2. **There is nothing left to collapse.** `@putout/engine-parser@15.5.0` ships `types` for every
   one of those subpaths, so idea 9's fix deleted all six lines at once. What remains is a single
   `declare module '*.css'`, which is a genuine ambient declaration for a non-JS import and must
   stay.

The lesson is the second reason. The shim was not neutral weight — an ambient `declare module`
**shadows** the real declaration, so those imports were `any` from the moment the types landed.
Deleting them did not just remove noise; it closed a blind spot. A local shim over a module that
has real types is worse than the problem it papers over.

## 4. Split the store barrel from the store slice

**Evidence.** `store/reducers.ts` is the second most-touched file in 30 days (13) and is
documented as being *both* the slice and the barrel every other store file imports from.

**Why it kept growing.** It is the default place to put a type, so the types accumulate. The
re-export earns its keep — it is what lets `state.ts` and `revive.ts` move without touching an
importer — and it is also why the file is a magnet.

**Done, and the idea had it backwards.** The barrel the idea proposed *creating* already existed:
`store/index.ts`. The measured problem was the inverse — **26 of 42 importers bypassed it**, reaching
past into `.../store/reducers` to get a type, because the names were only re-exported from there.

So the change was the other way round. `reducers.ts` is now the slice and nothing else, and
`index.ts` re-exports the state types and `persist`/`revive` straight from the file that defines
each. All 26 importers go through `#store`; zero reach into a slice from outside `src/store/`.

Two things the plan did not predict:

- **Inside `src/store`, the barrel is a cycle.** `selectors.ts`, `parserSelectors.ts` and
  `operations.ts` import `RootState` from `./reducers.ts` directly and must keep doing so. So the
  rule is *by directory*: outside, `#store`; inside, the defining file. `no-runtime-import-cycles`
  is what enforces it and it passed on every step.
- **`persist`/`revive` had a spec in the wrong file.** `reducers.spec.ts` tested both and asserted
  they were `reducers.ts` exports, because the re-export is what put them there. That spec is now
  `revive.spec.ts`, and the export-list assertion names the slice alone.

The menu files were the only awkward part: two of them held a namespace `#store` import alongside a
named one, which `esm/remove-imports-with-duplicate-source` rejects. Merging them meant renaming a
local (`canSave` → `canSaveSnippet`) to avoid shadowing the imported selector.

**Risk named in the plan, and worth repeating:** this was expected at 35 lines and landed at
~290 across 31 files. `lessons.md` had already recorded one store split going that way.

**What is left, measured, and deliberately not done here.** `reducers.ts` is at zero. But 11
files still reach past the barrel for the other two slices — 10 for `../store/selectors.ts` and
one for `../store/operations.ts` — so the barrel is not yet the only way in. Most of those are
`import * as selectors from '../store/selectors.ts'`, and the two menu files showed what that
costs: a namespace import cannot absorb named bindings, so merging it means renaming every
`selectors.foo` call site. That is its own change, with its own cycle risk, and it is not what
this idea asked for. The rule is now written down in `store/index.ts`; the remaining 11 are
follow-up.


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

**Item 1 is done, and it did not take the form the plan assumed.** The plan said the fixture is
the oracle and `❌` must *equal* `test/fixture/<name>.js`. That is false here, in two ways: the
fixtures moved to `lib/<rule>/fixture/`, and the README examples are deliberately *different* code
— `apply-press-modifier-case` documents a `MODIFIERS` array, not the fixture's two `press()` calls,
because they are examples rather than tests. A byte comparison would have failed on all three
rules and taught nothing.

So the check is behavioural, in `packages/plugin-putout-editor/test/readme.js`, and it pins the
property the fixer actually erased: **the ❌ fence must still report, and the ✅ fence must not.**
Three rules, both directions, one assertion each; a failure names the rule.

```
# readme: every ❌ example is still rejected by its own rule
  diff: + [ "apply-press-modifier-case" ]
```

Verified by reproducing the original bug — making the `apply-press-modifier-case` ❌ fence
byte-identical to its ✅, which is what `putout . --fix` did — and separately by making a ✅ fence
violate its own rule. Both fail. Neither passes while broken.

The three filesystem rules needed a `tokens.css` in the fake tree or `remove-undefined-token`
reports every example and the ✅ half is vacuous. **Its contents are derived from the ✅ fence**,
because that fence is the definition of correct: if ✅ names a token, that token is defined.
Deriving from the fence under test would define the very name the ❌ fence is about.

Items 2 and 3 are unchanged and still open: the upstream rule that *runs* a fence, and a root
`redlint scan` as the missing gate. See [`issues/markdown.md`](./issues/markdown.md).

## 8. Generate the architecture diagrams

**Evidence.** The client diagram has 17 elements and 51 hand-drawn edges, copied from
`config/boundaries-config.ts`, and nothing checked it.

**Done for the client graph, and the check found the drift on its first run.**
`scripts/gen-diagrams.mjs` reads the map out of `boundaries-config.ts` — which had to export it,
the one-line blocker the idea named — and rewrites the block between
`<!-- gen:client-imports -->` markers. `bun run lint` runs it with `--check` and fails when the
doc is stale; `bun run gen:diagrams` writes it.

The hand-drawn diagram was **missing three edges the policy has always allowed**: `ui → editor`,
`store → snippet`, `snippet → editor`. Nothing had complained in the whole time it was wrong,
because the diagram was a second statement of the policy and only one of the two was enforced.
That is the argument for the generator, stated in one number.

Only the `A --> B` lines are generated. The node declarations, labels and `style app fill:#eee`
stay hand-written, because those are prose and do not drift. `app` is the one deliberate
simplification: its policy is `['*']` and it is drawn with the six elements it really uses.

**The other three diagrams stay hand-written, and that is a decision rather than an omission.**
The server and mcp graphs come from reading those packages; the putout counts in
[`putout-map.md`](./putout-map.md) need a checkout of the sibling repo that CI does not have. A
generated block nobody regenerates is worse than a written one, so the file now says which
diagrams are generated and why the others are not.

## 9. Give the parser subpaths real types upstream

**Evidence.** 9 `declare module` lines for `@putout/engine-parser/*`, growing one per parser,
touched 10 times in 30 days, and irreducible locally (idea 3).
**Why it pays.** Every one of those subpaths is `any`, so a type error *inside* a parser is
invisible to this repository. That is a real blind spot, and a local shim never shrinks it.

**Done upstream, and the local fix is "delete".** `@putout/engine-parser@15.5.0` ships `types` for
every subpath this repository declared — `.`, `./acorn`, `./babel`, `./babel/options`,
`./babel/plugins`, `./espree`, `./esprima` — so all six `declare module` lines are redundant and
were deleted. `supertape.d.ts` is now one line, `declare module '*.css'`.

**The shim was not neutral weight, and this is the part worth remembering.** An ambient
`declare module` **shadows** the real declaration, so those six imports were `any` from the moment
the types landed. `tsc` was green *because* it could not see them. Proof, both ways:

```ts
// with the shim present - tsc exits 0, and this is wrong:
parseAcorn(42); // number where string is required

// with it deleted - tsc errors, which is right:
// error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.
```

Measured across all six subpaths, not just one: mistyped arguments, a bogus property on the
returned `Program`, and wrong types for `plugins` and `options` all now fail. A green `tsc` that
was green for the wrong reason is exactly the check that cannot be trusted.

**Verified against the installed version only.** I did not check upstream for a newer
`@putout/engine-parser`, so "done upstream" means "done as of 15.5.0".
