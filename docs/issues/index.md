# Findings

One file per area. Each is the **problem**, the **result**, and the **solution** — a repro, a
diff, and what was expected. Nothing else. If it does not fit here it is not a finding yet.

| File | What |
|---|---|
| [`build.md`](./build.md) | `bun i` and the browser bundle; the operator fix that landed |
| [`coverage.md`](./coverage.md) | the 100% gate, and the eleven files it excludes |
| [`e2e.md`](./e2e.md) | `write()` selects nothing under the `vim` keymap |
| [`markdown.md`](./markdown.md) | the `js` fence gate, and why `putout .` is not the rule |
| [`putout-plugins.md`](./putout-plugins.md) | the rules in `packages/plugin-putout-editor` |
| [`qword.md`](./qword.md) | vim blockwise visual, and a paste diagnosis that was wrong |
| [`tape.md`](./tape.md) | `stub` types, and two rules that do not ship |

Elsewhere: [`docs/plugins.md`](../plugins.md) is the guide for writing a rule here, and the
[plugin README](../../packages/plugin-putout-editor/README.md) documents each rule.

For the 🐊**Putout** repository itself — what the 116 plugins have in common and how to write one
that matches — read [`docs/putout-map.md`](../putout-map.md) and
[`docs/putout-style.md`](../putout-style.md).

[`docs/architecture.md`](../architecture.md) carries the mermaid diagrams: the four packages and
how they relate, the client's enforced import graph, the server's modules, and the mcp's tools.

For the meta level — what breaks, where it clusters, and what to do about it — see
[`docs/lessons.md`](../lessons.md) and the [`docs/ideas.md`](../ideas.md) backlog it feeds.
`AGENTS.md` says to add to that backlog without being asked.
