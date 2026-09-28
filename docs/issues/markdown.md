# Markdown fences

**Open only.** What the gate is and where it comes from is in
[`../memory/fence-gate.md`](../memory/fence-gate.md).

## ❌ `putout .` cannot run it, or fix it

The rule is enabled only in putout's **`.filesystem.json`** match, and it needs the filesystem
AST, so it runs under **`redlint`** and never under `putout .`. There, a wrong fence is caught
by the generic `parser` rule with a message that is simply false:

```sh
$ putout . --fix
 4:7 error Missing initializer in const declaration.  parser
```

The declaration *has* an initializer. `--fix` leaves the fence alone, so the error survives a
second run.

**Solution.** Check fences with `redlint scan`, which lints `process.cwd()` and takes no path
argument — `cd` first. Never `redlint fix` at the repo root: `coverage/remove-files` will
delete the local `coverage/`. Current state passes at 100%.

**Keep anti-patterns out of `js`/`ts` fences** — they are linted as real code, and `--fix`
"corrects" the example and deletes the point of it. Write them inline.

## ❌ the fixer has already eaten one of them

`packages/plugin-putout-editor/README.md`, `apply-press-modifier-case` ❌/✅ pair, was
byte-identical in both blocks:

```js
// ❌ and ✅
await page.keyboard.press('Control+v');
await page.keyboard.press('ControlOrMeta+v');
```

`putout . --fix` applied the plugin's **own** `apply-press-modifier-case` rule to the fence
showing the violation, and the rule was right: `'Control+V'` became `'Control+v'`. The
documentation was corrected and the anti-pattern was deleted. Nothing failed — the fence is
valid JavaScript both before and after, so `parser` is satisfied and the rule has nothing to
report.

**Expected.** The ❌ block keeps `'Control+V'`; the two blocks are supposed to differ.

**Solution.** `putout-editor/apply-press-modifier-case` is `off` in the `*.md` match in the root
`.putout.json`, beside `remove-comments` and `remove-duplicated-receiver` — the other two rules
whose ❌ example is a fence. The rule is a **code** rule, so it still runs over `packages/client`'s
e2e specs, which is where the six violations were.

**The generalisable failure.** A fence that demonstrates a violation is *valid code that the
rule rejects*, so the fixer's job and the example's purpose are exactly opposed, and the fixer
always wins. This is why a fence is not the right place to store an anti-pattern, and why
idea 7 in `docs/ideas.md` is a correctness item rather than a tidiness one.

**A check that would have caught it — and the check that was proposed does not work.**
The obvious version is textual: the ❌ block must equal the rule's fixture and the ✅ block
`*-fix.js`. **It would have failed on all three rules**, for two reasons. The fixtures moved to
`lib/<rule>/fixture/`, not `test/fixture/`. And the README examples are deliberately *different*
code — `apply-press-modifier-case` documents a `MODIFIERS` array, not the fixture's two `press()`
calls — because they are examples, not tests. A byte comparison would have failed while telling
you nothing about the bug.

So the check is behavioural, and pins the property the fixer actually erased: **the ❌ fence must
still report, and the ✅ fence must not.** It is `packages/plugin-putout-editor/test/readme.js`,
three tests, one assertion each, and a failure names the rule:

```
$ bun run test   # in packages/plugin-putout-editor
❌ not ok 2 should deep equal
    + [ "apply-press-modifier-case" ]
```

Both directions are verified by breaking them, because a check that passes while broken pins
nothing: making the ❌ block byte-identical to the ✅ fails test 2, and adding a duplicated
receiver to a ✅ block fails test 3.

## ❌ `--fix` deleted a gate's diagnostics

Found while writing the generator above, and a new variant of the `--fix` damage in `lessons.md`.

`scripts/gen-diagrams.mjs` reports why it failed through `process.stderr`, so that `remove-console`
stays on at the repository root. `putout . --fix` removed all four reporting statements
**including their message arguments**:

```diff
     if (process.argv.includes('--check')) {
-        if (current !== generated) {
-            say('docs/architecture.md is stale: ...');
-            say('run: node scripts/gen-diagrams.mjs');
-            process.exit(1);
-        }
+        if (current !== generated)
+            process.exit(1);
     }
```

**Expected.** A diagnostic is not a `console` call to be deleted; it is the part that makes the
exit code actionable.

**Why it matters more than the other `--fix` damage on record.** The recorded cases weaken an
assertion or corrupt a fence — the tool stops doing its job. This one turns a check that explains
itself into one that exits 1 silently, which is strictly worse than having no check: a silent
gate gets deleted by the next person who decides it is broken.

The same run also duplicated the file's entire 19-line header comment when it removed the shebang.

**Solution.** Re-read what `--fix` did to any file, every time — the exit code is not evidence.
For a file whose purpose is to *report*, keep the reporting on `process.stderr` and re-read the
whole file afterwards.

