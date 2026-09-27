# markdown

## ✅ the `js` fence gate

A `js` fence must be JavaScript; TypeScript goes in a `ts` fence. The rule is
`markdown/apply-ts-codeblock-in-file` (`@putout/plugin-markdown`), a **filesystem** scanner: it
reports a fence whose body is valid TypeScript but not valid JavaScript, and `fix` switches the
fence to `ts`.

It is a sub-plugin, not a standalone one — hence `plugin_syntax: markdown is not defined` if you
ask the mcp for it by that name. The mcp's `get_example('markdown')` now reads the installed
rule, with a spec pinning the two, because a hand-copy had drifted and reported a different
message than the shipped rule.

## ❌ `putout .` cannot run it, or fix it

The rule is enabled only in putout's **`.filesystem.json`** match, and it needs the filesystem
AST, so it runs under **`redlint`** and never under `putout .`. There, a wrong fence is caught
by the generic `parser` rule with a message that is simply false:

```sh
$ putout . --fix
 4:7 error Missing initializer in const declaration.  parser
```

The declaration *has* an initializer. `--fix` leaves the fence alone, so the error survives a
second run.

**Solution.** Check fences with `redlint scan`, which lints `process.cwd()` and takes no path
argument — `cd` first. Never `redlint fix` at the repo root: `coverage/remove-files` will
delete the local `coverage/`. Current state passes at 100%.

**Keep anti-patterns out of `js`/`ts` fences** — they are linted as real code, and `--fix`
"corrects" the example and deletes the point of it. Write them inline.
