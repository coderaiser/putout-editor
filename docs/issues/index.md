# Issues

**Open problems only.** Something leaves this list when it is fixed, and the part worth
keeping goes to [`../memory/`](../memory/) — what the cause was, so it is not re-derived. A
resolved problem left here is documentation that reads as if it were still broken.

| File | Open problem |
|---|---|
| [`build.md`](./build.md) | `server` has no `nest` binary, so `redrun build` fails there |
| [`markdown.md`](./markdown.md) | the `js` fence gate runs only under `redlint`, and nothing at the root runs it |
| [`putout-plugins.md`](./putout-plugins.md) | a fixer can rewrite a rule and no test notices; two fixes exit clean on lossy cases; `apply-type-check` fires on domain types |

Elsewhere:

- [`../ideas.md`](../ideas.md) — the backlog: things not implemented yet.
- [`../memory/`](../memory/) — what was learned, and why the code is the way it is.
- [`../architecture.md`](../architecture.md) — where things live and which seam owns what.
- [`docs/plugins.md`](../plugins.md) — how to add a rule here; the [plugin
  README](../../packages/plugin-putout-editor/README.md) documents each one.
- For the 🐊**Putout** repo itself: [`../putout-map.md`](../putout-map.md) and
  [`../putout-style.md`](../putout-style.md).

