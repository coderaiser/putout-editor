# Chat

**Open only.** What was fixed is in [`../memory/`](../memory/index.md).

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

## ❌ a `PATH` export as the fix for `rspack: not found` — forbidden, not merely unwise

**Rejected.** `AGENTS.md` puts a `PATH` export in a trap, and so does this branch's
own history.

The chat plan (`~/plan.md`, outside this repository, so the reasoning is repeated
here rather than left behind a path a reader cannot follow) asked for
`packages/chat/.madrun.ts` to prefix its build with
`export PATH="$PWD/../../node_modules/.bin:$PATH"`, which is the workaround its
author says they "already found manually". That exact export was **added,
diagnosed, and removed on this branch**: `89208bc` fixed the real cause and
`06be1bc` took the export out.

The real cause was a nested `packages/client/node_modules` — from the client alone
pinning `@types/node@^22` while four other workspaces wanted `^26`. `redrun` stops
at that nested tree and puts its **non-existent** `.bin` on `PATH`, so every local
binary vanished and the e2e build failed with `rspack: not found`. The version
pin was the fix; the export had been a workaround for the symptom. See
[`../memory/workspaces.md`](../memory/workspaces.md) for the measurement.

So the plan was proposing the second attempt at a bug whose first attempt is in
this branch's log. **Not done, and the commit history is the reason.**

The diagnosis was also self-refuting: it says `bun run` puts `node_modules/.bin`
on `PATH` and therefore the bare `rspack` already resolves — which is the whole
premise. The export is only reached in the shells that do not have the bin
directory, and those are the shells `redrun` was breaking.

## ❌ a guard rule for `100vh` in a stylesheet does not have a shape

**Rejected, for three independent reasons.** The first is expensive to rediscover,
which is why it is written down.

**The AST in the plan does not exist in this repo.** It proposes

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
filenames. The plan half-admits this and then writes a `find`-based code rule
anyway. A
filesystem rule that could be scoped would also be `off` by default and need a
`.filesystem.json` match to turn on — three moving parts to protect a one-token
edit that already carries a comment explaining itself.

**What is in its place:** `the document does not scroll` in `e2e/mobile.ts`. That
is the property the `dvh` choice actually rests on, it is asserted, and it fails if
the reasoning ever stops being true. A rule cannot do that — only a spec can.

## 📝 the composer as a CodeMirror editor — route recorded, not started

The one row the chat plan calls "a project, not a step". Recorded here rather than
started, because starting it would reverse a decision somebody wrote down.

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

## ❌ a `min-width: 0` one level too deep changes nothing at all

Found while fixing the seeded thread's horizontal overflow (see
[`../memory/chat-layout.md`](../memory/chat-layout.md#the-seeded-thread-and-the-three-things-it-broke)).

`.chat-app__body` is `display: grid`, `.chat` is its item, and `.chat__thread` is
inside `.chat`. The thread's content is wider than a phone — a `white-space: pre`
source listing and a `nowrap` help table — so on a 390px viewport
`document.scrollWidth` was 514.

**The minimum that reproduces it**

```css
.chat-app__body {
    display: grid;
}

.chat {
    min-width: auto; /* the default */
}

.chat__thread {
    min-width: 0; /* correct, and inert */
}
```

**What I got** — `.chat` stayed 514px wide and `scrollWidth` stayed 514. Putting
`min-width: 0` on `.chat` fixed it.

**What I expected** — the thread's content is what overflows, so capping the
thread's minimum should cap it.

The reason is that `min-width: auto` on `.chat` — a **grid item** — refuses to
shrink below its content, and `.chat__thread` is a child of it, so the child's
own `min-width` is never consulted. The rule was not weaker on the thread, it was
absent.

**Not filed as a rule.** `apply-box-sizing-to-sized-element` is about `width` on a
sized element and this is about the `min-*` *defaults* of a flex or grid item —
different shape, and a fixer would have to decide which of the two ancestors the
rule meant. Written up here because the failure is silent: the CSS is correct,
the lint is clean, and the layout is wrong.

## ❌ a rename that changes what parses leaves the old spelling in six strings

Removing the `/` prefix from the command grammar left every user-facing message
naming a command that no longer parses.

**The minimum that reproduces it**

```js
// parse.ts — the command is the first word, so this names nothing
const parsed = parseCommand('/ast'); // → { command: '/ast' }
```

```ts
// ast.ts, unchanged
const answer = (): CommandResult => ({
    type: 'error',
    message: 'No source. Use /source first.',
});
```

**What I got** — four commands answer `No source. Use /source first.` (in `ast`,
`find`, `transform`, `test-pattern`) and the chat shows `No AST. Run /ast first.`
and `Run /ast to populate the tree`.

**What I expected** — the strings follow the grammar, as the code did.

The awkward part is that these are the messages a user is given *before* they have
a source — every one of them is read at exactly the moment the hint would be
followed. And `grep` for the command name finds the definition; each call site is
a different file, in a different package, inside a string literal.

**The check that would catch it**: after changing what the parser accepts, search
for the old spelling in text rather than in identifiers. Nothing in `putout .`
does this, and a rule for it would have to know both the old and new spelling —
which makes it a rename helper rather than a lint.
