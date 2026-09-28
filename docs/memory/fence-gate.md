# The `js` fence gate

**A `js` fence must be JavaScript; TypeScript goes in a `ts` fence.** The rule is
`markdown/apply-ts-codeblock-in-file` (`@putout/plugin-markdown`), a **filesystem** scanner: it
reports a fence whose body is valid TypeScript but not valid JavaScript, and `fix` switches the
fence to `ts`.

It is a sub-plugin, not a standalone one — hence `plugin_syntax: markdown is not defined` if you
ask the mcp for it by that name. The mcp's `get_example('markdown')` now reads the installed
rule, with a spec pinning the two, because a hand-copy had drifted and reported a different
message than the shipped rule.

**Both halves are closed, and it is `putout .` that closes them — not `redlint`.** This note
said the gate needed `redlint` and that nothing ran it, which was right for the wrong reason:
the rule is a filesystem scanner, but the *fence* is also plain text to every other rule, so a
`js` fence holding TypeScript is a parse error to the `parser` rule and is reported from the
repository root with no extra step. Re-measured, both directions:

```
interface Foo { a: string; }   // in a js fence
 100:0  error  Parsing error: Unexpected reserved word 'interface'.  parser (eslint)
```

A `ts` fence holding plain JavaScript is **not** reported, and that is fine: it is valid code in
a fence that says it is valid code.

**The other half was the fixer, and it is the config that fixes it.** `putout . --fix` used to
strip the comment out of `remove-comments`' own ❌ fence — the example and the fixer wanted
opposite things. `"putout-editor/remove-comments": "off"` in the `*.md` match ends it, measured
the same way:

```
comment before --fix: 1
comment after  --fix: 1
```

**The lesson that is worth keeping is the measurement one.** That finding was wrong twice in
opposite directions before it was right, and both times the fault was the setup rather than the
subject: a probe whose shell quoting failed, so no config was ever written and every form
looked like it worked; then a re-measurement run against a README the fixer had already
stripped, so there was nothing to report and every form "passed" again. Before a measurement
means anything, assert the thing being measured is in the state you think it is — a probe that
asks whether a rule is silenced must first check the rule has something to report.
