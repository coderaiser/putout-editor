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
| [`putout-rules.md`](./putout-rules.md) | putout types the whole plugin contract so a rule can be type-checked; how to visit every node; an includer's `fix` takes a bare `path`; a fixer must replace a node, not write to it; `getFilename` is absolute under `redlint`, so a fixture built with `parseFilesystem` never met the runner; a pattern key is a whole name and `{a,b}` is not a `match` alternative; `UPDATE=1` regenerates fixtures and `noTransform` rewrites the source; a replacer needs a `replace` it never runs; a new rule's blast radius, and why a scoped lint run is silent on `.ts` |
| [`fence-gate.md`](./fence-gate.md) | a `js` fence must be JavaScript; the rule is a sub-plugin of the markdown plugin |
| [`build.md`](./build.md) | an operator must not import a processor, and why `IgnorePlugin` cannot fix it |
| [`workspaces.md`](./workspaces.md) | install with `bun i --no-save` and a workspace symlink is not the published build; a package subpath import must not carry a `.ts` extension; `print()` takes what `putout`'s `parse()` produced; `--fix` corrupts an `as` cast without `isTS`, and a file emptied by `--fix` is the rules working |
| [`browser-bundle.md`](./browser-bundle.md) | a green build says nothing about whether the page runs: 🐊Putout calls `os.homedir()` at module scope, an `IgnorePlugin` does not fix a dynamic `require`, and `chunks: 'all'` makes a lazy chunk eager |

The house rules these all point at are in [`../../MEMORY.md`](../../MEMORY.md).
