# markdown findings

Status: ✅ resolved, ❌ open.

---

## ✅ `convert-js-to-ts` — a `js` fence holding TypeScript

Landed in `@putout/plugin-markdown@1.5.0`; installed here at **1.5.1**. It is **not** a
standalone plugin — it is the sub-plugin of the `apply-ts-codeblock-in-file` scanner, so the
path is [`packages/plugin-markdown/lib/apply-ts-codeblock-in-file/convert-js-to-ts`](https://github.com/coderaiser/putout/tree/master/packages/plugin-markdown/lib/apply-ts-codeblock-in-file/convert-js-to-ts)
and the scanner that runs it is `lib/apply-ts-codeblock-in-file/index.js`. (The older
`lib/convert-js-to-ts` path no longer exists.) That is also why the mcp ships the rule as an
inline example rather than a loadable name — `find_places` with `plugin: 'markdown'` answers
`plugin_syntax: markdown is not defined`.

The rule is a `matchFiles` scanner over `*.md`, and it reports a fence whose language is `js`
when the body parses cleanly as TypeScript **and** not as plain JavaScript — the exact
definition of "this is TypeScript, the fence is lying". Fix: rewrite the fence to `ts`.

Verified directly against the installed plugin (not the mcp copy):

````sh
$ cd scratch && redlint scan
- markdown: apply-ts-codeblock-in-file
✖ markdown: apply-ts-codeblock-in-file 1

.filesystem.json
 4:14 error Use 'ts' instead of 'js' fence for TypeScript markdown/apply-ts-codeblock-in-file

$ redlint fix      # then re-read the file
````

`fix` flips **only** the offending fence and leaves a genuine-JavaScript fence alone:

````md
```ts
const a: string[] = [];
```

```js
const b = [];
```
````

---

## ❌ the rule only runs under `redlint` — and `putout .` cannot fix it

`apply-ts-codeblock-in-file` is enabled in exactly one place in `putout/putout.json`: the
**`.filesystem.json`** match. The `*.md` match lists only `"markdown": "on"`, and the scanner
never fires there, because it is a *filesystem* scanner — it needs the filesystem AST and the
`@putout/cli-filesystem` injection that `redlint` performs. So **`putout .` — which is what
`bun run lint` runs — never executes it.**

What fires instead is the generic `parser` rule, which reads the fence as JavaScript because
that is what it declares. It reports something unhelpful and `--fix` does **not** resolve it:

````sh
$ mkdir scratch && printf '# p\n\n```js\nconst a: string[] = [];\n```\n' > scratch/probe.md
$ cd scratch && putout . --fix
probe.md
 4:7 error Missing initializer in const declaration. parser
 4:7 error Parsing error: Missing initializer in const declaration. (1:7) parser (eslint)
````

Nothing there says "TypeScript in a `js` fence", and the `Missing initializer` message is
simply wrong — the declaration *has* an initializer. The fix pass does not touch the fence or
the code; it inserts a blank line inside the block:

```diff
 ```js
 const a: string[] = [];
+
 ```
```

A second `--fix` run reports the same two errors, so the finding is **unfixable by `--fix`** and
the file stays wrong. Without `--fix` the message is at least accurate about the symptom
(`TypeScript type annotations are not allowed in JavaScript code`, `parser (quick-lint-js)`),
but a TS `interface` additionally trips `remove-nested-blocks` and `parser (eslint)`, which is
noise rather than diagnosis.

**Nothing in this repo runs `redlint` over `docs/`.** The root `.madrun.ts` has
`prelint: putout bin .github deploy` and no `redlint` at all; only
`packages/client/.madrun.ts` has `prelint: redlint fix`, and it runs from that package's
directory, so it only ever sees `packages/client`. The docs are therefore never checked by the
rule that implements the gate.

**What I expected.** `putout .` to report `markdown/apply-ts-codeblock-in-file` for a `js`
fence holding TS, and `--fix` to switch the fence to `ts`.

**Solution.** Keep the fences correct by hand (the current state passes: `redlint scan` at the
repo root reports `markdown: apply-ts-codeblock-in-file 100%`), and do not expect `putout .` to
catch a mistake here. This is the mechanism behind the standing "never `--fix` over `docs/`"
rule in `AGENTS.md`: the fixer cannot do the right thing about a fence here, and the error it
leaves behind is unfixable, so a `--fix` run both misses the real problem and leaves noise.

**Careful with `redlint` at the repo root.** It lints `process.cwd()` and takes no path
argument, and `redlint fix` will act on `coverage/remove-files` — at the root it reports
`Remove files: '…/putout-editor/coverage'`, i.e. it wants to delete the local coverage
directory. Run `redlint scan` (not `fix`) unless you mean it.

