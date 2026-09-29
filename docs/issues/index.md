# Issues

**Open problems only.** Something leaves this list when it is fixed, and the part worth
keeping goes to [`../memory/`](../memory/) — what the cause was, so it is not re-derived. A
resolved problem left here is documentation that reads as if it were still broken.

| File | Open problem |
|---|---|
| [`build.md`](./build.md) | `nest build` reports 279 errors that `tsc` does not |
| [`putout-plugins.md`](./putout-plugins.md) | two upstream fixers exit clean on lossy cases; a fixer can rewrite a rule and no test notices; `apply-destructuring` drops a `&&` guard |
| [`scripts.md`](./scripts.md) | the three scripts `AGENTS.md` tells every agent to run were not at the root |

Elsewhere:

- [`../ideas.md`](../ideas.md) — the backlog: things not implemented yet.
- [`../memory/`](../memory/) — what was learned, and why the code is the way it is.
- [`../architecture.md`](../architecture.md) — where things live and which seam owns what.
- [`../plugins.md`](../plugins.md) — how to add a rule here; the [plugin
  README](../../packages/plugin-putout-editor/README.md) documents each one.
- For the 🐊**Putout** repo itself: [`../putout-map.md`](../putout-map.md) and
  [`../putout-style.md`](../putout-style.md).
