# The `js` fence gate

**A `js` fence must be JavaScript; TypeScript goes in a `ts` fence.** The rule is
`markdown/apply-ts-codeblock-in-file` (`@putout/plugin-markdown`), a **filesystem** scanner: it
reports a fence whose body is valid TypeScript but not valid JavaScript, and `fix` switches the
fence to `ts`.

It is a sub-plugin, not a standalone one — hence `plugin_syntax: markdown is not defined` if you
ask the mcp for it by that name. The mcp's `get_example('markdown')` now reads the installed
rule, with a spec pinning the two, because a hand-copy had drifted and reported a different
message than the shipped rule.

**The gate exists, but nothing here runs it** — that is the open half, in
[`../issues/markdown.md`](../issues/markdown.md).
