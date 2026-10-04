# Chat

**Open only.** What was fixed is in [`../memory/`](../../memory/).

## ❌ a Playwright measurement taken right after `page.goto` reads an unmounted page

Found while writing the mobile e2e for the composer overflow below, and it is the reason one of
those three specs passed on a build that is 40px too wide.

`e2e/test.ts` navigates in a fixture and hands the page to the spec. A geometry assertion that
calls `page.evaluate` immediately afterwards measures a document React has not painted yet, and
`document.documentElement.scrollWidth` of an empty document **is the viewport width** — so the
assertion passes. The minimum that shows it, against the unfixed `chat.css` on
`devices['iPhone 12']`:

```ts
test('probe', async ({page}) => {
    const before = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        hasInput: Boolean(document.querySelector('.input')),
    }));
    
    await expect(page.getByTestId('input')).toBeVisible();
    
    const after = await page.evaluate(() => document.documentElement.scrollWidth);
    
    console.log({
        before,
        after,
    });
});
```

**Got** — `before: {scrollWidth: 390, hasInput: false}`, `after: 430`, on three consecutive
runs, with no navigation in between.

**Expected** — 430 for both, because the composer is `content-box` and 40px too wide in that
build and it is on screen for the whole of the test.

So `the composer fits the viewport width` **passed** on the broken build and would have stayed
green for ever. `page.goto` resolves on `load`, and `createRoot().render()` in `index.tsx`
happens after it.

**The rule it gives: a measurement is an assertion about a page, so wait for the page.** Every
geometry assertion in `e2e/mobile.ts` waits for `data-testid="input"` first, and the comment on
the spec says why. An assertion that can pass on an empty document is not a weaker check — it is
a check of nothing.

This is `MEMORY.md`'s "a check that passes on a cheaper path than the user takes", and the
cheaper path was *an empty page*: the assertion ran before the thing it asserts about existed.
`docs/memory/e2e.md` is the neighbouring lesson.

## ❌ `plan-v3.md` §2: the `PATH` export is not coming back

**Rejected, and it is the one item in v3 that is forbidden rather than merely
unwise.** `AGENTS.md` puts it in a trap, and so does this branch's own history.

`plan-v3.md` §2 asks for `packages/chat/.madrun.ts` to prefix its build with
`export PATH="$PWD/../../node_modules/.bin:$PATH"`, which is the workaround the
author of the plan says they "already found manually". That exact export was
**added, diagnosed, and removed on this branch**: `89208bc` fixed the real cause
and `06be1bc` took the export out.

The real cause was a nested `packages/client/node_modules` — from the client alone
pinning `@types/node@^22` while four other workspaces wanted `^26`. `redrun` stops
at that nested tree and puts its **non-existent** `.bin` on `PATH`, so every local
binary vanished and the e2e build failed with `rspack: not found`. The version
pin was the fix; the export had been a workaround for the symptom. See
[`../memory/workspaces.md`](../memory/workspaces.md) for the measurement.

So the plan is proposing the second attempt at a bug whose first attempt is in this
branch's log. **Not done, and the commit history is the reason.**

The diagnosis in §2 is also self-refuting: it says `bun run` puts `node_modules/.bin`
on `PATH` and therefore the bare `rspack` already resolves — which is the whole
premise. The export is only reached in the shells that do not have the bin
directory, and those are the shells `redrun` was breaking.

## ❌ `plan-v3.md` §4: the `100vh` guard rule does not have a shape

**Rejected, for three independent reasons.** The first is expensive to rediscover,
which is why it is written down.

**The AST in the plan does not exist in this repo.** §4 proposes

```js
traverse(ast, {
    Declaration(path) {
        const {property, value} = path.node;
        
        if (is(property, 'height') && /\b100vh\b/.test(value))
            places.push(path);
    },
});
```

There is no `Declaration` visitor with `node.property` / `node.value` in putout's
CSS processing. A rule sees `rule(selector([...]), [declaration('height', ...)])` —
a `CallExpression` — and reaches the declarations through `__b.elements`. Getting
this right cost most of the time in
[`../memory/putout-rules.md`](../memory/putout-rules.md)'s neighbourhood; the
working shape is `apply-box-sizing-to-sized-element`.

**The name breaks the convention.** `apply-dvh-in-chat-css` is named after a
*package*. Rules here are named after the shape they detect, and `apply-box-sizing-to-sized-element`
— which covers the same ground from the same stylesheets — is the model.

**A rule cannot be scoped to `packages/chat/` at all.** That is the entire reason
`matchFiles` exists: a 🐊**Putout** rule sees one AST and knows nothing about
filenames. §4 half-admits this and then writes a `find`-based code rule anyway. A
filesystem rule that could be scoped would also be `off` by default and need a
`.filesystem.json` match to turn on — three moving parts to protect a one-token
edit that already carries a comment explaining itself.

**What is in its place:** `the document does not scroll` in `e2e/mobile.ts`. That
is the property the `dvh` choice actually rests on, it is asserted, and it fails if
the reasoning ever stops being true. A rule cannot do that — only a spec can.

## 📝 the composer as a CodeMirror editor — route recorded, not started

Idea 5 in the plan, and the only row it calls "a project, not a step". Recorded
here rather than started, because starting it would reverse a decision somebody
wrote down.

The client has a full CodeMirror setup — `@codemirror/view`, `@codemirror/state`,
`@codemirror/lang-javascript`, `@replit/codemirror-vim`, and eleven modules under
`packages/client/src/editor/`. Chat's dependencies are exactly five and none of
them is any of those.

**The blocker is the seam, not the code.** `config/boundaries-config.ts` restricts
`editor` to `['parser']`, and `docs/architecture.md` records the arrow policy as
enforced by `boundaries/dependencies`. `packages/chat/README.md` says the tree
components hold no Redux and are reused in both places, and `AstTree` was copied
into chat *specifically so the two could not fight*. Importing the client's editor
reverses that.

Two honest routes:

- **Extract.** Move the editor into a package both depend on, widen the boundaries
  map, and make the arrows say so. This is the route the architecture wants, and
  it is several days.
- **Build a small one in chat.** CodeMirror without vim, without search, with JS
  highlighting and line numbers — roughly `create-editor.ts` plus an `Editor.tsx`.
  Days, not weeks, and it keeps the seam.

**The recommendation is the second**, for one reason: the seam exists because two
editors sharing a document would fight over the caret, the undo stack and the
selection. Extracting shares the code and keeps that risk; a small editor in chat
does not share anything.

**Whatever the route, the e2e list is the spec for the swap** and each item needs a
passing test *before* it starts:

1. `Enter` behaviour per pointer type — **exists**, `e2e/desktop.ts` and
   `e2e/mobile.ts`
2. `↑` recalls the last line, `↓` walks back — `↑` exists, `↓` does not
3. `/` opens the autocomplete and completes — exists in `Input.spec.tsx`, not e2e
4. `Ctrl+Enter` sends — exists in both projects
5. the box still grows and caps at `max-height` — `growTo` is unit-tested, not
   measured in a browser

Only 1 and 4 are e2e today. 2, 3 and 5 have no e2e at all, so a swap would land
with three of its five guarantees unmeasured.

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

Reported as "<https://putout.cloudcmd.io/chat> does not work after build". The build was green,
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

## ✅ calling a method pulled off a destructured parameter — in the browser, not just happy-dom

**The minimum code that reproduces it**

```js
const rows = [...document.querySelectorAll('.ast-row[data-category]')];

// inside `page.evaluate`, in a real browser:
rows.map(({getAttribute}) => getAttribute('data-category'));
```

**The result I got**

```
Error: page.evaluate: TypeError: Illegal invocation
    at eval (eval at evaluate (:311:30), <anonymous>:5:11)
```

**What I expected**

`rows.map(element => element.getAttribute('data-category'))`. Destructuring a parameter takes the
*value* out of the object; a method taken that way is a bare function, and calling it binds `this`
to `undefined`.

**Resolved** — the call site is a `for..of`, and the reason is written down there. This is the
browser half of a trap `AstBlock.spec.tsx` already documents for happy-dom, where the same line
answers nonsense rather than throwing. The rule that would have caught it is
[idea 12](../ideas.md#12-a-rule-for-calling-a-method-with-no-receiver--rejected-putout-blocks-the-fix) —
**rejected**, with the measured blocker: putout refuses a replacement that introduces a name the
pattern does not bind.
