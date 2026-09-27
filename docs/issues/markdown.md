# markdown

## ✅ the `js` fence gate

A `js` fence must be JavaScript; TypeScript goes in a `ts` fence. The rule is
`markdown/apply-ts-codeblock-in-file` (`@putout/plugin-markdown`), a **filesystem** scanner: it
reports a fence whose body is valid TypeScript but not valid JavaScript, and `fix` switches the
fence to `ts`.

It is a sub-plugin, not a standalone one — hence `plugin_syntax: markdown is not defined` if you
ask the mcp for it by that name. The mcp's `get_example('markdown')` now reads the installed
rule, with a spec pinning the two, because a hand-copy had drifted and reported a different
message than the shipped rule.

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

**A check that would have caught it.** The plugin's own fixture is the oracle — the ❌ block
must equal `test/fixture/apply-press-modifier-case.js` and the ✅ block
`apply-press-modifier-case-fix.js`. Nothing asserts that today; the README and the fixtures
drifted independently.

