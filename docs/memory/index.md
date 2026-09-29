# Memory

**What was learned, and why the code is the way it is.** Not a backlog and not a findings list:
a finding is still being worked on and lives in [`../issues/`](../issues/), an idea is not
started and lives in [`../ideas.md`](../ideas.md). This is the third thing — the part worth
keeping once the problem is closed, so the cause is not derived a second time.

| File | What it keeps |
|---|---|
| [`editor-vim.md`](./editor-vim.md) | why blockwise visual cannot grow, and a paste diagnosis that was measured and disproved |
| [`e2e.md`](./e2e.md) | the `vim` keymap eats `ControlOrMeta+a`, so `write()` must not use a key press |
| [`coverage.md`](./coverage.md) | the 100% gate was once 100% of a chosen set, and the eleven files that remain |
| [`tape.md`](./tape.md) | the types are fine; two rules that would write them do not ship |
| [`putout-patterns.md`](./putout-patterns.md) | moved: the placeholder grammar is now [§3 of `putout-style.md`](../putout-style.md#3-rule-shape) |
| [`putout-rules.md`](./putout-rules.md) | the traps a `scan` or an inner matcher hides: an empty file arrives as `{}`, and a rule can see comments |
| [`fence-gate.md`](./fence-gate.md) | a `js` fence must be JavaScript; the rule is a sub-plugin of the markdown plugin |
| [`build.md`](./build.md) | an operator must not import a processor, and why `IgnorePlugin` cannot fix it |

The house rules these all point at are in [`../../MEMORY.md`](../../MEMORY.md).
