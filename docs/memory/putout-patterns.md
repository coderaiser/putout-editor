# putout patterns

**Moved.** A rule can be a template — a `match`/`replace` map of pattern strings — and the
placeholder grammar that goes with it is now [§3 Rule shape](../putout-style.md#3-rule-shape)
of [`putout-style.md`](../putout-style.md), next to `traverse` and `replace`, which are the
shapes it is an alternative to.

Read there:

- the `__a` / `__a__` / `__a__()` table, and the third row's silent failure;
- why `match` and `replace` are alternative shapes rather than composable parts;
- the engine caching compiled templates within a process, and why a surprising pattern must be
  re-run in a fresh one.

This file is kept as the redirect so the old links still land somewhere. The traps that are
about *this* repository's rules rather than about the style are in
[`putout-rules.md`](./putout-rules.md).

