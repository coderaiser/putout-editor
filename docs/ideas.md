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
| 7 | A rule for an assertion that cannot fail informatively | S |
| 8 | Write up migrating `plugin-putout-editor` to TypeScript | S |
| 9 | Fixers for `hoist-arrow-callback` and `check-try-catch-destructure` | M |
| 10 | A rule for a guard the pattern key already made unreachable | S |
| 11 | Splicing the newline into a controlled textarea by hand — **rejected** | S |
| 12 | A rule for calling a method with no receiver — **rejected** | S |

## 11. Splicing the newline into a controlled textarea by hand — rejected

**Evidence.** `plan.md` for the `/chat` composer flip, §8, prescribes it: *"Plain
Enter newline insertion in a controlled textarea — React controls `value` via
state. The browser's default newline behaviour is suppressed by React's synthetic
event system in some configurations. The safest approach: call
`event.preventDefault()` on plain Enter to suppress any default, then manually
insert `\n` at the cursor position via `setText`. The cursor restore via
`requestAnimationFrame` is necessary because `setSelectionRange` on a textarea
whose value just changed via state needs the DOM to re-render first."*

**It was never written, and it is not needed.** A `textarea` inserts the newline
itself and fires the `input` event, which React's `onChange` already turns into
state — React does not suppress it. Measured, not assumed: the e2e presses
`Enter` in a real Chromium and asserts both halves,

```ts
await expect(box(page)).toHaveValue('/help\n');
await expect(userMessages(page)).toHaveCount(0);
```

and passes.

**The caret maths would have worked in a spec, which is the part worth keeping.**
The reason to be suspicious of a hand-rolled version here is not that it cannot
be tested. Probed: on a jsdom `textarea` with `value = '/help'`, `selectionStart`
is `5` and `setSelectionRange` and `requestAnimationFrame` both exist, so a spec
would have got the expected value and gone green. The machinery would have been
paid for by a test that cannot tell whether the browser was doing the same thing
or the component was. The checks that *could* have caught it — a real
keystroke — are the e2e's, and the e2e only exists because this was measured
there first.

**The cost is not the code, it is the second copy.** The hand-rolled version has
to know where the caret is, and so does the browser, and now they can disagree.
Leaving it alone means the newline behaviour is the platform's.

**Why it is still here.** Because the next plan to touch a controlled textarea
in this repo will say the same thing, and "React suppresses it" reads as a
measured fact. It is not; it is a plausible mechanism that was checked against
an e2e and found wrong.

## 7. A rule for an assertion that cannot fail informatively

**Evidence.** 201 `t.ok(...)` calls in specs across this workspace. The two common shapes are
`t.ok('field' in schema.shape)` and `t.ok(result.text.startsWith('Error:'))` — a boolean that
says only *whether*, never *what*. A schema test with three field checks reports the same
message whichever field is missing, and the failure is a boolean with no diff.

**Why it pays.** `t.deepEqual(Object.keys(schema.shape), ['fixture'])` fails with the missing
field named; `t.ok('fixture' in schema.shape)` does not. Every one of these is a test that passes
or fails without telling the next person what to look at.

**How.** This is `@putout/plugin-tape`'s — it already ships `convert-ok-to-match`,
`convert-ok-to-pass` and `convert-ok-to-called-with`, so the conversion half exists. What is
missing is a rule for the assertion that *cannot* be converted, because converting
`t.ok(a && b)` means writing the expected value a human has to choose. Something like
`tape/convert-ok-in-object-to-deep-equal` for the `in` shape, where the expected value is
mechanical.

**Here, not just there.** I wrote `t.ok(a.includes('x') && a.includes('y'))` in two of the
specs added this week and the maintainer caught it. That is the argument for a rule: I would not
have written it if the lint had rejected it.

**Note.** `tape/convert-equal-to-ok` pushes the *other* way, and the two together are the whole
tension: it rewrites `t.equal(result, true)` into `t.ok(result)`. The resolution is not to pick a
side but to stop asserting booleans — compare the value, so neither rule has anything to say.

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

## 8. Write up migrating `plugin-putout-editor` to TypeScript

**Evidence.** 17 `index.js` files, `100%` coverage, and a `test:dts` that echoes `no types` — so the
type surface is *declared* absent rather than absent, and the write-up is a decision about what that
script should check. Three things it has to argue, or it is a list of benefits nobody can act on:

- the claim is **"the types exist and this package opts out"**, not "TypeScript is good" — the rule
  contract is already typed upstream (`putout-rules.md` § 🦎Putout types the plugin contract);
- **one rule migrated end to end**, and `check-main-imports-in-file` is the honest one: a `matchFiles`
  rule with a mask, an `exclude` and an inner plugin is most of what needs typing;
- the **fixtures**, which are deliberately untyped and would need `@ts-expect-error` or a declaration
  of their own — `__putout_processor_filesystem(...)` is data wearing a `.js` extension, and that is
  the part most likely to come out *worse* in TS.

Size S for the write-up; the migration itself is M and is not what is being asked for.

## 9. Fixers for `hoist-arrow-callback` and `check-try-catch-destructure`

**Evidence.** Both ship report-only. The `hoist-arrow-callback` fixer was built, worked, and was
removed because its second half could not be made to land — so what remains names the problem and
fixes nothing. Neither blocks anything, since report-only is the shape CI enforces.

**The arrow one needs a name, and that is the whole design question.** `(file) => isFile(file)` hoists
to `file`, which is right when the parameter is unused in the body and a **shadowing bug** when it is
used. So the options are different rules: hoist only when the parameter is **unused** and name it from
the method (`isFile` for `filter`, `isX` for `some`), so nothing is ever shadowed; or hoist always and
fall back to report-only when the name is taken. The first is safe and covers most real code, and both
need a collision check against the enclosing scope before inserting, because a top-level `const` that
already exists is a redeclaration, not a hoist. Size M.

**The try/catch one is S.** The rewrite is mechanical and always the same — bind, then guard — so the
risk is dropping a default the author meant, which is a test rather than a code change.

## 10. A rule for a guard the key already made unreachable

**Evidence.** 1, found by the coverage gate rather than by reading: `apply-boolean-cast-to-typeof`
sat at 73.33% branches because `matcher` had three `if (...) return false` guards and `replacer` had
a fourth, and **not one of them could ever be false**. Both are keyed on the same
`Boolean(__a) && typeof __a === "object"`, and the key decides every case the guards re-checked —
verified one at a time, and the cast form the README said the guard existed to protect matches the
key **zero** times.

**Why it pays.** The guards read as defensive and are not, which is worse than not having them: a
reader checks the guard instead of checking the key, so a key that is too loose looks safe. And a
100%-coverage gate is the only thing in this repo that noticed — 253 tests, all green, and the
uncovered lines were the whole defect. That is `docs/memory/putout-rules.md`'s "a pattern key is a
whole name" from the other end: the key is not a prefilter for the matcher, it **is** the matcher.

**How.** A rule cannot see the other half of a plugin, so this is not expressible as a lint rule —
it is a *coverage* rule: an uncovered branch in a rule whose `match` and `replace` share a key, in a
package with `checkCoverage`, is a guard that the key made dead. `@putout/plugin-*` has no such
check, and it belongs upstream. Here the cheap form is a `t.noReport` per guard, the same way
`no-comments` needed one: a fixture where the shape the guard rejects is present, asserting the
plugin still reports nothing. The guards are deleted rather than covered —
[`issues/putout-plugins.md`](./issues/putout-plugins.md) has the measurement, and
`AGENTS.md`'s "a rule name is a claim about what it checks" is the same argument about a comment.

## 12. A rule for calling a method with no receiver — rejected, putout blocks the fix

**Evidence.** `rows.map(({getAttribute}) => getAttribute('data-category'))` — written in
`packages/chat/e2e/desktop.ts` this run and it failed **twice** before it worked, both times in
a way no unit spec could see. In a browser, `page.evaluate: TypeError: Illegal invocation`. In
happy-dom, `getAttribute` reads `Symbol(attributes)` off `this` and answers nonsense. The trap is
already recorded for happy-dom in `AstBlock.spec.tsx`; the browser half is new.

**The blast radius is zero.** Measured over every `.ts`/`.tsx`/`.js`/`.mjs` in `packages/` and
`scripts/` (`find | grep -v node_modules`, parsed with `putout`'s own parser, walking every
`ArrayExpression`): **0 sites**. The repo does not do this, which is why a rule would be a guard
on the house style rather than a cleanup.

**Why it is rejected rather than filed as open.** The rule was written, with the fixtures, and
`putout` refuses the *replacement*:

```
☝️ Looks like template values not linked: ["__","__a","__b"] -> ["__","__c","__a","__b"]
```

The fix has to name the object it came from, and the pattern does not bind it. `AGENTS.md` already
says this in advance — *"anything a fixer would have to invent a name for"* keeps the guard out of
the `match`, because a guard placed in the reporter filters the wrong thing — and a rule that only
reports cannot run in the normal runner at all, so it would not be a rule here even if it
compiled.

Every escape was measured and none works:

| Attempt | Result |
|---|---|
| `__.method((__c) => __c.__a(__b))` | `__c` is unbound in the pattern — the error above |
| `__.method(({__a}) => __a.__a(__b))` | `__a` binds twice with two meanings |
| `__.method(({__a: __c}) => __c.__a(__b))` | `__c` is still new |
| report-only plugin | cannot run: `find`/`scan` with no `fix` throws |

So the rule is not buildable in 🐊**Putout** today, and `docs/issues/putout-plugins.md` already
carries the general version of this gap. **What is in the tree instead** is the thing that
actually prevents it: `AstBlock.spec.tsx` names the trap for happy-dom, and the e2e comment in
`packages/chat/e2e/desktop.ts` names it for the browser.

**What would make it buildable.** Either 🐊**Putout** allows a replacement to introduce a placeholder
and synthesise a name for it (the same question as idea 9's fixers, and the same answer: a name is
a decision, not a rewrite), or the rule moves to `redlint`, where a report-only scanner is a
legitimate shape. The second is the smaller change and the reason this is filed rather than
dropped.
