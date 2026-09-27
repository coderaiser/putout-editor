# putout plugin rules

Where a rule for this repository goes, and what already landed. Status: ✅ landed, 💡 proposed.

- **About this repository** -> `packages/plugin-putout-editor`, wired in through `plugins` in
  the root `.putout.json`. `docs/plugins.md` is the guide for writing one.
- **About any 🐊**Putout** user** -> the [🐊Putout](https://github.com/coderaiser/putout) repo.
- **A defect in a tool** -> `docs/issues/`, with a minimum repro, the result, and the
  expectation. Related: [`tape.md`](./tape.md), [`markdown.md`](./markdown.md),
  [`build.md`](./build.md), [`coverage.md`](./coverage.md), [`qword.md`](./qword.md).

An entry needs a repro. A suspicion goes in the handover, not here.

---

## ✅ `press-modifier-case`

A browser reports Ctrl+V as `v`. Playwright's `press('Control+V')` sends `V` with no Shift
keydown - a chord no keyboard produces - so it matches no binding and fails silently, because
the browser fires a paste instead.

Found six instances in this repository on its first run, in specs that were passing:

```diff
-    await page.keyboard.press('ControlOrMeta+V');
+    await page.keyboard.press('ControlOrMeta+v');
```

---

## ✅ `apply-type-check`

`node.type === 'CallExpression'` says what `isCallExpression(node)` says in fewer characters,
and the `is*` helpers in `types` are tested once rather than in every rule that needs a node
kind. `arg?.type === 'StringLiteral'` is the same truth with an optional chain, so that goes
too. All four shapes are handled: either operand order, either operator, with or without `?.`.

The safety argument is the existence check - a comparison is only rewritten when
`types['is' + type]` is a function, so `action.type === 'snippet/save'` is untouched. That
matters more than it looks: `types.is()` is **not** the "is this a known type" helper, it
returns false for everything, and reaching for it would have rewritten redux action types.

**Known gap.** The fix does not add the import, because `plugin-declare` does not know the
`is*` helpers live in `types`. One line by hand, and the lint flags it as `no-undef` right
after. A rule that injected the import would remove the second step.

---

## ✅ `remove-rgb-outside-tokens`

Colours are tokens: `css/tokens.css` holds them and every other stylesheet reaches for a
`var()`. The convention had already broken - `css/mobile.css` carried a hardcoded
`rgb(0 0 0 / 20%)` - and the empty `check-css` script CI ran in place of a check is now gone,
with the rule enforced from `fix:lint`.

A **filesystem** rule, built on `matchFiles`, so it sees a tree and runs under `redlint` rather
than `putout .`. Two facts that cost time:

- **CSS is JS.** `@putout/processor-css` runs `happy-style`, so `rgb(0 0 0 / 20%)` is
  `functionValue('rgb', [...])` and `#ff0000` is `color('#ff0000')` - not the `hashValue` the
  `formats` example suggests. A `var()` is `functionValue('var', [...])`.
- **redlint reports positions inside its synthetic `.filesystem.json`**, so the rule puts the
  filename in the message.

---

## ✅ report-only is possible, at the cost of one no-op action

A plugin needs one of `find`, `traverse`, `replace`, `include`, `exclude`, `rules`, `declare` or
`scan` for the loader to recognise it, and a `find` with no `fix` throws in the normal runner.
`check-match` in `@putout/plugin-putout` is a replacer whose `replace` maps the pattern **to
itself**; `check-replace-code` sets a flag that suppresses its own `fix`. Either way it is one
no-op action, and `remove-rgb-outside-tokens` uses the first - its test runs the fix and asserts
the file comes back byte for byte.

---

## 💡 the mcp's plugin examples are hand-copies

`get_example` shipped hand-written copies of rules that also exist as real rules, and they
drifted: the `markdown` copy reported a different message *and* matched on `source.value` where
the shipped rule uses `extract(source)`. It now reads the installed rule, with a spec pinning
the two. See `packages/mcp/src/examples.ts`.
