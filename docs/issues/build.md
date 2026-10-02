# Build

**Open only.** What was fixed is in [`../memory/build.md`](../memory/build.md) — an operator
importing a processor, and why `IgnorePlugin` is the wrong answer.

**No lock file is committed, and that is deliberate.** `*.lock` is in `.gitignore`; CI installs
with `bun i -f --no-save`. The history shows the decision made twice on purpose — `server/yarn.lock`
removed in `6009dcb` ("chore(yarn.lock) rm"), and the last `bun.lock` removed in `bd8bc9d`. A
checkout resolving current versions is the intended behaviour, not an unpinned gap, so it is not
a finding and should not be re-filed. This replaced an entry here that read it as one.

## ❌ `nest build` reports 279 errors that `tsc` does not

The `server` workspace builds through `nest build` (`.madrun.ts`). It fails, and the errors are
not in the code:

```sh
$ npx tsc --noEmit        # in packages/server
$                        # clean, 0 errors

$ npx nest build
src/parse/compact.ts:3:27 - error TS2583: Cannot find name 'Set'.
  Found 279 error(s).
```

**Expected.** Two tools, one answer. **Got** — `tsc` accepts the source and `nest build`
rejects it, on `Map` and `Set` that `tsconfig.json` targets at `ES2022` for. The counts, so the
shape is visible rather than "it fails":

| Code | Count | |
|---|---|---|
| TS2583 | 64 | Cannot find name `Map`/`Set` |
| TS2304 | 64 | Cannot find name |
| TS2697 | 56 | Non-relative import cannot be resolved |
| TS18046 | 32 | `catch` is `unknown` |
| TS2339 | 30 | Property does not exist |

So `lib` is not resolving under the nest build, and the import errors follow from it rather
than being 279 separate mistakes. `nest-cli.json` only sets `deleteOutDir`, and `tsconfig.json`
is shared, so the difference is in how nest invokes tsc rather than in either file.

This is the finding to re-check by running `npx nest build` in `packages/server` — the two
numbers to compare are `tsc --noEmit` and the `Found N error(s)` line.

**Re-checked 2026-09-29, still reproducing exactly**: `tsc --noEmit` exits 0 with no errors,
`nest build` reports `Found 279 error(s)` and exits 1, and every code count above is unchanged
(64 / 64 / 56 / 32 / 30). Nothing here has been fixed in the tree.

## ❌ every unmatched URL answers 200 with the editor's `index.html`

Found as "`https://putout.cloudcmd.io/chat.html` renders the same as `https://putout.cloudcmd.io`".
It is not the chat build: it is how `packages/server` serves `out/`, and it predates the chat
package entirely.

The minimum that shows it, against the real app (`STATIC=../../out node dist/main.js`):

```sh
$ curl -s -o /dev/null -w '%{http_code} %{content_type}\n' localhost:8080/chat.html
200 text/html; charset=utf-8          # and the body is <title>Putout Editor 3.5.0</title>
$ curl -s -o /dev/null -w '%{http_code} %{content_type}\n' localhost:8080/nope-xyz.js
200 text/html; charset=utf-8          # a missing script answers with a page
$ curl -s -o /dev/null -w '%{http_code} %{content_type}\n' localhost:8080/runtime-48359543fd44e134-26.js
200 text/javascript; charset=utf-8    # a real one is correct
```

**Expected** a 404 for a path that names a file. **Got** the editor's page, with a 200.

The cause is one default. `ServeStaticModule.forRoot({rootPath})` with no `renderPath` registers
its fallback from `DEFAULT_EXPRESS_RENDER_PATH`, which is **`'{*any}'`**:

```js
// @nestjs/serve-static/dist/serve-static.constants.js
export const DEFAULT_EXPRESS_RENDER_PATH = '{*any}';
```

and the loader turns it into `app.get('{*any}', renderFn)`, where `renderFn` is
`res.sendFile(indexFilePath)`. So **every** unmatched GET is answered with `out/index.html` and a
200 — including a `.js`, which the browser then refuses as a script. `app.module.ts` configured
`rootPath` alone and never said otherwise.

**This is why `curl` on a nonsense path is the check.** A missing asset and a valid route are
indistinguishable from the outside when both answer 200: `/api/v1/info` returns JSON, a real chunk
returns JavaScript, and everything else returns the page. Only asking for a name that cannot exist
separates them.

**`exclude` is the fix, and it takes a RegExp** — `isRouteExcluded` handles one directly, so a
path matching it falls through to a 404 instead of the fallback. The pattern is `[^\s/]`, not `\w`:
every hashed asset in this build has a hyphen (`runtime-48359543fd44e134-26.js`) and `\w` does not
match one, so a `\w` guard answers *every real filename* with the page and looks correct on
`/nope-xyz.js`. That was measured, not reasoned — the first version of the fix was `\w` and the
spotted control caught it.

The fallback itself is wanted and is kept: the editor has no router of its own, and `/some/route`
should still reach it.

## ❌ do not reach for `IgnorePlugin`

Three attempts, all of which compiled and then broke the app:

| ignored | build | app |
|---|---|---|
| `@putout/processor-css` plus several packages | compiles | does not render |
| `stylelint` only | compiles | `F.homedir is not a function` |
| `stylelint`, `config-loader`, `cosmiconfig` | clean, no warnings | `Cannot find module 'stylelint'` |

`IgnorePlugin` makes a module unresolvable, and 🐊**Putout** resolves processors **by name at
runtime** through the loader's `customRequire`. In a bundle that `require` must find the module
by its real name, so a processor cannot be dropped while something still asks for it. Each
attempt only moved the error to the next import.
