# putout plugin ideas

Not defects — **ideas**, collected as they come up. Anything here that a rule could detect or
fix belongs upstream in the [putout](https://github.com/coderaiser/putout) repo; anything about
*our* lint configuration or the mcp belongs in this repo. Status: 💡 proposed, ✅ landed, ❌
won't do.

Each entry is the same shape as a finding: the minimum thing that shows it, what I got, and
what I expected. An idea with no repro is not an idea yet — it is a guess, so leave it in the
handover until something reproduces.

---

## 💡 the mcp's plugin examples are hand-copies, and they have already drifted

`packages/mcp/src/examples.ts:199` carries a hand-written copy of the `convert-js-to-ts` rule.
The shipped rule lives in `@putout/plugin-markdown` and is what actually lints. The two have
already diverged:

| | `report` message |
|---|---|
| mcp copy (`examples.ts:218`) | ``Use a 'ts' fence for TypeScript`` |
| shipped `@putout/plugin-markdown@1.5.1` | ``Use 'ts' instead of 'js' fence for TypeScript`` |

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

---

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

---

## 💡 `putout/align-spaces` reports `1:1` for a line-level problem

````
src/editor/create-editor.spec.ts
 1:1  error  Keep whitespaces in blank lines  putout/align-spaces (eslint)
````

The offending line was inside a function body — line 8 in that file, not line 1 — and the
message does not say how wide the line should be. I hit this twice on a single new file and had
to compare against an existing file with `cat -A` to discover the convention is *keep the block
indentation on blank lines inside blocks, leave top-level ones empty*.

**What I expected.** The line and column of the blank line, and the expected width.

**Proposal.** Report the position, and either name the expected indentation or state the rule
("match the indentation of the enclosing block"). A fixer-adjacent rule that cannot point at
its target is hard to act on, and the rule is otherwise right.

---

## 💡 `keyboard.press('Control+<uppercase>')` is a Playwright trap

Playwright sends `event.key === 'V'` for `press('Control+V')`, with no Shift keydown — a chord
no real keyboard can produce. A browser reports Ctrl+V as `'v'`. So a spec that writes
`Control+V` is always a mistake for `Control+v`, and it fails *silently*: nothing throws, the
binding simply never matches, and the browser fires a `paste` instead.

````ts
// never fires a binding - no real keyboard sends ctrl+shift-free 'V'
await page.keyboard.press('Control+V');

// what a browser actually sends for Ctrl+V
await page.keyboard.press('Control+v');
````

**What I expected.** A spec that presses a bound key to work, and for the failure to be visible.

**Proposal.** A `playwright/press-modifier-case` rule: a modifier plus a single uppercase letter
in `press`/`keyboard.press` is a mistake — offer to lowercase it. This is the same class of
defect as the `tape/` rules, for a different test framework, and the cost of getting it wrong
here is an afternoon of chasing the wrong layer.
