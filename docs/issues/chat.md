# Chat

**Open only.** What was fixed is in [`../memory/`](../../memory/).

## ❌ the composer is 40px wider than a phone, and the dropdown with it

`.input` is `width: 100%` with `padding: 12px 20px 18px` and **no `box-sizing`**, so it is
`content-box` and adds its own horizontal padding on top of `width: 100%`. `.autocomplete` has
the same shape through `left: 20px; right: 20px`. Both in `src/css/chat.css`.

Measured with `getBoundingClientRect()` on `devices['iPhone 12']` (390×664), built bundle:

```js
const measured = {
    winW: 390,
    docScrollW: 430,
    input: {left: 0, right: 430},
    send: {right: 410},
    autocomplete: {left: 20, right: 410},
};
```

**Expected** — everything inside 390. **Got** — `document.scrollWidth` 430 on a 390px screen, so
the *whole document* scrolls sideways on every phone, and the send button's right edge sits at
410px: 20px of the button is off-screen and cannot be tapped. The dropdown's last ~20px is
likewise unreachable.

`box-sizing: border-box` on the two selectors fixes it, verified by re-measuring:
`docScrollW` 430 → 390, `send.right` 410 → 370, `autocomplete.right` 410 → 370.

**Not the bug it looks like.** The desktop e2e passes, because at 1280px wide the 40px is
invisible. It is also not a keyboard problem: the grown box caps correctly at `max-height: 200px`
with `overflow-y: auto`, the dropdown does not overflow the top, and the 46×46 send button is a
valid tap target. Measured all three; they are fine.

**The unit suite cannot see this.** Nothing in `src/` changes — it is `chat.css`, and no spec
asserts geometry. `docs/memory/browser-bundle.md` is the neighbouring lesson: a green build says
nothing about what a screen looks like.

## ❌ `packages/chat` e2e does not run in CI at all

`.github/workflows/e2e.yml` runs `redrun test:e2e` with `working-directory: packages/client`.
`redrun` collects scripts from the cwd and every **parent** directory (`parentDirectories` in
`redrun/bin/redrun.js`) — it never descends into a sibling package. The root has a `test:e2e`
and the client has one; `packages/chat`'s is never collected.

So a green `E2E` job says nothing about the chat page, and its 15 specs have only ever run
locally. A chat e2e failure reaches master unnoticed.

**The fix is one step**, and it is not a `redrun` invocation — see the PATH trap in
[`../memory/workspaces.md`](../memory/workspaces.md):

```yaml
      - name: Chat e2e
        run: bun run test:e2e
        working-directory: packages/chat
```

**The part worth keeping: a green badge is evidence about the job that ran.** This is
`MEMORY.md`'s "a check that passes on a cheaper path than the user takes" in its plainest form —
the job is green because it tests the editor, not because anything is broken. `redrun`'s
name suggests otherwise: "run multiple npm-scripts fast" reads as *all* of them, and it is
*all of them on the way up*.

## ✅ `/chat` served a file listing: the page and its own chunk directory had the same name

Fixed in `a6a1bc7` — `HtmlWebpackPlugin` writes `chat/index.html`, and the
stylesheet moved into the directory with it. Re-checked against a built `out/` on
this branch rather than taken from the commit message:

```
$ ls out/ | grep -i chat
chat                                  # a directory, and no chat.html beside it
$ curl -s -D- -o /dev/null localhost:8080/chat | head -2
HTTP/1.1 302 Found
location: /chat/
$ curl -s localhost:8080/chat/ | head -c 60
<!doctype html><html><head><title>Putout Chat 3.5.0</title>
```

The redirect is still there and is fine — it is the *directory* that used to
answer with a listing, because a directory with no `index.html` in it is a
listing rather than a 404. `docs/memory/browser-bundle.md` keeps the cause.

Reported as "https://putout.cloudcmd.io/chat does not work after build". The build was green,
both pages were in `out/`, and every asset resolved — **and the URL was still wrong**, which is
the one failure `docs/memory/browser-bundle.md` is about.

The minimum that shows it, with `out/` built and served:

```sh
$ ls out/
chat  chat.html  index.html  …          # a directory AND a file, same name
$ curl -s -o /dev/null -w '%{http_code}\n' localhost:8080/chat
302
$ curl -s -D- -o /dev/null localhost:8080/chat | grep -i location
location: /chat/
$ curl -s localhost:8080/chat/ | head -3
<!doctype html>
<title>Index of /chat/</title>
```

**Got** — a 302 to a directory listing. **Expected** — the chat page, since `/chat` is what a
person types.

The cause is that `HtmlWebpackPlugin` wrote `chat.html` while `output.filename` already wrote
`chat/[name].js`, so `out/` held `chat.html` and `out/chat/` side by side. A static server
resolves `/chat` to the **directory** — the file beside it never wins — and a directory with no
`index.html` in it is a listing, not a 404. Nothing in the build reports this: both artifacts
were produced, `putout .` was clean, and `npm run build` exited 0.

The fix is one filename, `chat/index.html`, so the page lives inside the directory that was
already named after it and both `/chat` and `/chat/` serve it. **The stylesheet had to move with
it** — it was emitted at the root of `out/`, and a `href` from a page inside `chat/` into its
parent is a second silent break of the same kind, so `CssExtractRspackPlugin` now writes
`chat/[name]-*.css` as well.

**The part worth keeping is where the check has to happen.** Not in `bun run build`, and not in
the 128 unit tests, all of which passed throughout — the defect is in the *name* of an artifact,
and no unit test loads `out/`. It is two lines of `curl` against a served `out/`, or the e2e,
which now navigates to `/chat/` and fails on all seven specs if the name moves back. That is the
cheapest check in `../memory/browser-bundle.md` paying out on the same class of bug a second
time, and the reason the e2e's `page.goto` is named in `e2e/test.ts` rather than in each spec.

## ✅ `packages/client`'s build was red on 45 errors — fixed in `d7592fc`

`plan.md` invariant **I7** is "`npm run build` at root passes". It does now, and
`out/index.html` and the chat page are both produced. This entry is kept because
**the first fix made things worse in a way only a browser could see.**

The failure, measured with the tree stashed so it was `HEAD` and predated any
chat work:

```
$ cd packages/client && bun run build
Rspack compiled with 90 errors and 13 warnings in 26.05 s
```

45 distinct `ERROR in` blocks, two causes:

- 43 across `import-meta-resolve` (36), `stylelint` (6), `unicorn-magic` and
  `supports-hyperlinks`, all asking a browser for `fileURLToPath`,
  `pathToFileURL` or a named export it does not have;
- 2 for `typescript` requiring `inspector` and `import-meta-resolve` requiring `v8`.

The second pair was the easy half and the first was the whole build: `fallback`
already listed nine node-only builtins for this package and `inspector` and `v8`
were simply not among them. 45 → 43 → 0.

**The part worth keeping: the first fix compiled and the page was empty.** I
applied the same `REPLACED_WITH_NOTHING` list `packages/chat` uses, which stubs
`@putout/operator-match-files` to an empty module. The build went green, and the
served page threw:

```
TypeError: e6 is not a function
```

with no toolbar, no textboxes, and nothing but a stylesheet. The stack is a
`matchFiles` rule invoking its `scan`/`fix`, and `operator-match-files` is what
those rules are. Chat has no filesystem and runs no such rules, so stubbing it
there costs nothing; the client runs every rule in `plugin-putout-editor`, so the
same stub removed the operator out from under them.

**The same fix is right in one package and wrong in the other, and what decides
it is what the package does — not which packages it depends on.** That is why the
two configs no longer share a list even though four entries are identical, and
why the comment at the client's call site names the difference instead of pointing
at chat as the model. The full write-up, with the two `GREEN`-but-broken cases and
the cheapest possible check, is in
[`../memory/browser-bundle.md`](../memory/browser-bundle.md).

**Also fixed in the same commit, and only found by running it:** the root
`build` script chained `cd packages/client && bun run build && cd packages/chat`,
and the second `cd` resolves from *inside* the client — `can't cd to
packages/chat`, with the client having succeeded, which reads as a chat failure.
Both paths are absolute now.

Verified after the fix, not assumed: the client's e2e is **129 passed, 0 failed**,
the chat's is **7 passed**, and the built editor mounts with a toolbar, three
textboxes, an AST panel and two stylesheets and no console error.

## ✅ the `/chat` plan's step 1 breaks the client's coverage gate

Resolved by decision, not by a fix — see the end of this entry. Kept because the
measurement is the argument, and because the two files are still there on a
maintainer's choice rather than on an accident.

`plan-c.chat.md` §0.1 adds two files to `packages/client/src` — `export-tree.ts` and
`export-tokens.ts` — and invariant I3 requires client coverage to stay at 100. Those cannot both
hold. Added exactly as specified, both lint-clean and `tsc`-clean:

```
  export-tokens.ts                |       0 |        0 |       0 |       0 |
  export-tree.ts                  |       0 |        0 |       0 |       0 |
All files                         |   99.89 |    99.81 |   99.47 |   99.89 |
ERROR: Coverage for lines (99.89%) does not meet global threshold (100%)
ERROR: Coverage for functions (99.47%) does not meet global threshold (100%)
ERROR: Coverage for branches (99.81%) does not meet global threshold (100%)
ERROR: Coverage for statements (99.89%) does not meet global threshold (100%)
```

**Expected.** A new file in a `checkCoverage` package either is exercised or is excluded.
**Got** — 0%, and a red gate. `packages/client/.nycrc.json` is `all: true`, so a file nothing
imports is still measured, and nothing imports these two.

**The two files have no consumer in v2.** They existed so chat could alias-import client's
`Tree.tsx`, and v2 removed that: its own text says so twice.

- §3.2: "No `#store` alias required for the tree. **No client imports required.** `AstTree` is
  fully self-contained in `commands/components/`."
- §5.1: "**No client tree imports. No `../client/src/...` relative paths in chat.** … This is the
  key structural change from v1."

`AstBlock.tsx` (§3.2) imports `AstTree` from `commands`, and the one remaining alias, `#store`,
points at **chat's own** store. So §0.1 is a leftover from v1 that §3.2 and §5.1 did not delete —
and it is the only step that edits `client` at all, which is why I1 hangs on it.

**Resolved by decision, not by a fix** — the maintainer chose to keep both files per §0.1 and cover
them with `src/export.spec.ts` (3 tests: the re-export is the same binding as the original, and
`export-tree` exports `Tree` and nothing else). Client is back to 100% ×4 at 1048 tests. The
alternative — dropping both files — would also have satisfied I1 and I3 with no code, since v2 needs
neither. Noted here so the choice is not re-litigated without knowing both options were measured.