# putout plugin ideas

Not defects — **ideas**, collected as they come up. Anything here that a rule could detect or
fix belongs upstream in the [putout](https://github.com/coderaiser/putout) repo; anything about
*our* lint configuration or the mcp belongs in this repo. Status: 💡 proposed, ✅ landed, ❌
won't do.

Each entry is the same shape as a finding: the minimum thing that shows it, what I got, and
what I expected. An idea with no repro is not an idea yet — it is a guess, so leave it in the
handover until something reproduces.

***

## 💡 the mcp's plugin examples are hand-copies, and they have already drifted

`packages/mcp/src/examples.ts:199` carries a hand-written copy of the `convert-js-to-ts` rule.
The shipped rule lives in `@putout/plugin-markdown` and is what actually lints. The two have
already diverged:

|                                         | `report` message                                |
|-----------------------------------------|-------------------------------------------------|
| mcp copy (`examples.ts:218`)            | `Use a 'ts' fence for TypeScript`               |
| shipped `@putout/plugin-markdown@1.5.1` | `Use 'ts' instead of 'js' fence for TypeScript` |

**What I expected.** `get_example('markdown')` to return the shipped rule, or at least for a spec
to assert the two agree.

**Why it matters more than a stale string.** `docs/issues/markdown.md` was marked ✅ on the
strength of "verified: the shipped `get_example('markdown')` plugin rewrites its own fixture".
That verified the *copy*. The real rule turned out to be unreachable from `putout .` (next
entry), and nothing caught that for as long as the doc was there — which is the exact failure
`MEMORY.md` warns about when it says to re-check upstream rather than trust a proxy.

**Proposal.** Add `@putout/plugin-markdown` to `packages/mcp` and have the `markdown` example
load the real rule. If a copy has to stay (the example is a teaching artifact, and a real
plugin needs a markdown fixture), pin them together with a spec that compares `report`.

***

## 💡 the fence rule is unreachable from `putout .`

`markdown/apply-ts-codeblock-in-file` is enabled in exactly one place in `putout/putout.json` —
the **`.filesystem.json`** match. It is a `matchFiles` scanner, so it needs the filesystem AST
and the `@putout/cli-filesystem` injection that `redlint` performs, and the `*.md` match (which
lists only `"markdown": "on"`) never reaches it.

````sh
$ mkdir scratch && printf '# p\n\n```js\nconst a: string[] = [];\n```\n' > scratch/probe.md
$ cd scratch && putout .          # the normal lint
 4:7 error TypeScript type annotations are not allowed in JavaScript code  parser (quick-lint-js)

$ redlint scan                   # the filesystem lint
 4:14 error Use 'ts' instead of 'js' fence for TypeScript  markdown/apply-ts-codeblock-in-file
````

`putout .` names the symptom, not the cause, and `--fix` leaves the fence alone, so the error
survives the fix (verified — a second `--fix` run reports the same thing).

**What I expected.** The rule to report, and `--fix` to switch the fence to `ts`, from the
ordinary lint. That is what its own fix already does correctly.

**Proposal.** Promote `convert-js-to-ts` from a sub-plugin of a filesystem scanner to a rule the
`*.md` match can enable, so the gate runs where people run linters. Failing that, a putout
option that runs the `.filesystem.json` rule set as part of `putout .`.

***

## 💡 `putout/align-spaces` reports `1:1` for a line-level problem

```
src/editor/create-editor.spec.ts
 1:1  error  Keep whitespaces in blank lines  putout/align-spaces (eslint)
```

The offending line was inside a function body — line 8 in that file, not line 1 — and the
message does not say how wide the line should be. I hit this twice on a single new file and had
to compare against an existing file with `cat -A` to discover the convention is *keep the block
indentation on blank lines inside blocks, leave top-level ones empty*.

**What I expected.** The line and column of the blank line, and the expected width.

**Proposal.** Report the position, and either name the expected indentation or state the rule
("match the indentation of the enclosing block"). A fixer-adjacent rule that cannot point at
its target is hard to act on, and the rule is otherwise right.

***

## ✅ `press-modifier-case` — a modifier plus an uppercase key is a Playwright trap

Playwright sends `event.key === 'V'` for `press('Control+V')`, with no Shift keydown — a chord
no real keyboard can produce. A browser reports Ctrl+V as `'v'`. So a spec that writes
`Control+V` where it means `Control+v` fails *silently*: nothing throws, the binding simply never
matches, and the browser fires a `paste` instead. This is how the visual-block bug in
`docs/issues/qword.md` was chased through the wrong layer for a whole session.

Landed in `packages/plugin-putout-editor` as `putout-editor/press-modifier-case`, wired through
`plugins` in the root `.putout.json`, and enabled in the client too (putout merges configs up
the tree). The wrong form is written inline above rather than in a fence on purpose: a `ts`
fence is linted as real code, so `putout --fix` "fixed" the anti-pattern in this file and
deleted the example — the fixer is right about the code and wrong about the prose, so the
example has to live outside something it can rewrite.

It paid for itself on arrival, over the repo's own e2e specs:

```diff
-    await page.keyboard.press('ControlOrMeta+V');
+    await page.keyboard.press('ControlOrMeta+v');
```

Four in `e2e/desktop.ts`, one in `e2e/snippet.ts`, and one each in the desktop and mobile
helpers. Those paste specs were passing with the uppercase form — the browser fires the paste
either way — so the change is safe, which is checked by running the suite rather than assumed.

***

## ✅ `remove-rgb-outside-tokens` — colours belong in `tokens.css`

The CSS architecture was a convention in a comment. It had already broken: `css/mobile.css`
carried `box-shadow: 0 -4px 16px rgb(0 0 0 / 20%)` while `css/tokens.css` holds 111 colour
definitions. Now it is a rule, and the one violation is fixed.

This is the second kind of rule in `packages/plugin-putout-editor`: a **filesystem** rule, built
on `matchFiles`, so it needs the filesystem AST and runs under `redlint` rather than `putout .`.
That is 🐊**Putout**'s design working as intended — a rule knows nothing about filenames, so a
statement about a tree has to be expressed against a tree.

Two things about CSS in 🐊**Putout** that cost time and are worth keeping:

- **CSS is JS.** `@putout/processor-css` runs `happy-style`, so `rgb(0 0 0 / 20%)` is
  `functionValue('rgb', [...])` and `#ff0000` is `color('#ff0000')` — *not* `hashValue`, which is
  what the `formats` example suggested. A `var()` is `functionValue('var', [...])`, which is what
  these files should be using.
- **Report-only is a real option**, and the cost is one no-op action. `matchFiles` hands the
  outer rule a `fix`, but the *sub*-plugin still needs an action for the loader to recognise its
  type, and `replace` accepts the pattern as a replacement string — so a replacement that prints
  the node back unchanged is free and cannot corrupt the file. That is what `check-match` does,
  and it is what this rule does: choosing which token a colour becomes is a human decision.

`redlint` reports positions inside its synthetic `.filesystem.json`, so the rule puts the
filename in the message — otherwise the finding does not say which file to open, which is the
defect this repo already has a finding about for `putout/align-spaces`.

The dead `scripts/check-css.js` and its CI step are gone: the gate is now part of
`packages/client`'s `fix:lint`, so it runs in CI without a separate step.

***

## 💡 there is no report-only rule for the normal runner

I wanted a second rule for this repo: `no-direct-qword-create-editor`, which reports importing
`createEditor` from `qword/client` instead of the local wrapper that adds
`allowMultipleSelections` (the fix in `docs/issues/qword.md`). It has no safe automatic fix —
removing the specifier would break the file — and it turns out putout cannot express that.

A rule needs one of `find`, `traverse`, `replace`, `include`, `exclude`, `rules`, `declare` or
`scan`, or the loader refuses it:

```
Error: ☝️ Cannot determine type of plugin 'no-direct-qword-create-editor'.
```

`find` alone is report-only but throws in the normal runner (documented in `AGENTS.md`), and
`scan` only works as a `matchFiles` filesystem scanner, which `putout .` does not run — that is
the same reason the fence rule in `docs/issues/markdown.md` needs redlint.

**What I expected.** A rule that reports and leaves the fix to a human, so a wrong import that
cannot be mechanically corrected is still enforceable.

**Proposal.** Let a `report` + `match` pair be a valid rule type that reports without fixing,
and skip it during fix passes. Then the invariants that only a human can resolve stop living in
prose. For now the qword one lives as a comment on `createEditor` in the barrel and on the
wrapper, which is where the next reader will actually be.
