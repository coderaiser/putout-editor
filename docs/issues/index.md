# Issues

**Open problems only.** Something leaves this list when it is fixed, and the part worth
keeping goes to [`../memory/`](../memory/) — what the cause was, so it is not re-derived. A
resolved problem left here is documentation that reads as if it were still broken.

| File | Open problem |
|---|---|
| [`build.md`](./build.md) | `nest build` reports 279 errors that `tsc` does not; `objects-braces-inside-array` injects a blank line between every pair of comment lines in a file that reported nothing; every unmatched URL answers 200 with the editor's `index.html`, so a missing `.js` is served as a page |
| [`chat.md`](./chat.md) | nothing open — two resolved entries kept for their measurements: `/chat` served a directory listing because the page and its own chunk directory had the same name, and the `/chat` plan's step 1 adds two client files nothing imports, which broke the 100% coverage gate it also requires |
| [`putout-plugins.md`](./putout-plugins.md) | two upstream fixers exit clean on lossy cases; a fixer can rewrite a rule and no test notices; `remove-comments` reports one comment twice; `apply-destructuring` drops a `&&` guard; a rule green on every fixture and silent on the real tree; a `tryCatch` rewrite that throws on a real `package.json` |
| [`scripts.md`](./scripts.md) | the three scripts `AGENTS.md` tells every agent to run were not at the root |

Elsewhere:

- [`../ideas.md`](../ideas.md) — the backlog: things not implemented yet.
- [`../memory/`](../memory/) — what was learned, and why the code is the way it is.
- [`../architecture.md`](../architecture.md) — where things live and which seam owns what.
- [`../plugins.md`](../plugins.md) — how to add a rule here; the [plugin
  README](../../packages/plugin-putout-editor/README.md) documents each one.
- For the 🐊**Putout** repo itself: [`../putout-map.md`](../putout-map.md) and
  [`../putout-style.md`](../putout-style.md).
