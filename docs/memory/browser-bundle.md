# A browser bundle must be opened, not built

The gate for a page is not `bun run build` and it is not the unit suite. It is
opening the built page and looking at it.

`packages/chat` had a green build, a clean `tsc`, 128 passing tests and 100%
coverage, and the served page threw `TypeError: homedir is not a function` before
React mounted — an empty document, every gate satisfied. Nothing in a build
reports it, because the failure is a module *evaluating*, not a module resolving.

The same thing then happened again in `packages/client`, and the second time it
was **my own fix**: 45 errors → 0, a clean build, and a page that threw
`TypeError: e6 is not a function` with no toolbar and no textboxes. Two green
builds, two empty pages, one finding.

## The second case: a fix that satisfies the build and breaks the page

The client's build was red on 45 errors. The obvious fix was chat's fix — the same
`IgnorePlugin` list, the same empty-module replacement — applied to the same
dependency tree. It compiled. The page was empty.

The failing call was a `matchFiles` rule invoking its `scan`/`fix`, and
`@putout/operator-match-files` is what those rules *are*. Chat has no filesystem
and runs no such rules, so stubbing that operator there is free; the client runs
every rule in `plugin-putout-editor`, so the same stub pulled the operator out
from under them.

**The same edit is right in one package and wrong in the other, and what decides
it is what the package does — not which packages it depends on.** That is why the
two configs no longer share a list even though four entries are identical, and why
the comment at the client's call site says so rather than naming chat as the
model. A fix copied between packages is a hypothesis, and the copy is what makes
it feel like a fact.

## What 🐊Putout costs a browser, and why each piece is there

Every item below was found by opening the page, one at a time, not by reading a
report:

| Symptom on the page                                 | Cause                                                                                                 | Fix                                               |
|-----------------------------------------------------|-------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| `Y.homedir is not a function`                       | `env-paths` calls `os.homedir()` **at module scope**, via `cosmiconfig` from `putout`'s config reader | `IgnorePlugin`                                    |
| `fileURLToPath … not found in 'node:url'`           | `globby` / `unicorn-magic`; the `url` shim has no `fileURLToPath`                                     | `IgnorePlugin`                                    |
| `Cannot resolve 'v8'`, `'inspector'`                | `import-meta-resolve`                                                                                 | `fallback: false`                                 |
| `Cannot find module '@putout/operator-match-files'` | a **dynamic** `require` still resolves at runtime                                                     | `NormalModuleReplacementPlugin` → an empty module |
| 🐊Putout loaded on every visit anyway               | `splitChunks` `chunks: 'all'` made its chunk an *initial* script                                      | `chunks: 'async'`                                 |

Two of those are worth their own lines. **An `IgnorePlugin` is not enough for a
dynamic `require`** — the call site resolves when it runs, so ignoring the module
turns a build error into a page error. And **`chunks: 'all'` is a lie about
laziness**: it moves the chunk out of the entry's graph but still lists it in
`chat.html`.

## A barrel export is enough to put a module in the graph

`commands` re-exported `compilePlugin`, whose module calls `createRequire` at the
top level. Every consumer importing the barrel — for the parser, for the commands
— carried 🐊Putout with it. The fix was not a config change: it was taking the
export out of the barrel and asserting its absence, so it is not helpfully added
back:

```js
test('index: does not re-export compilePlugin, which drags in putout', (t) => {
    const result = 'compilePlugin' in api;
    const expected = false;
    
    t.equal(result, expected);
    t.end();
});
```

The same shape is why `commands` exports no React component and why
`index.spec.ts` filters the barrel for `/^(Ast|use)/`: the mcp imports that
package and has no DOM.

## A testid is an identity, not a decoration

`AstBlock` put `data-testid="ast-output"` on a wrapper around `AstTree`, which
already carried it. The page rendered two elements with one identity and
Playwright refused in strict mode. A component that has a testid does not get
another from its parent.

**The same class arrives from the other end: a feature that renders the thing
twice.** `/ast` answers in the thread *and* opens the console panel with the
same tree, so from that moment the page has two `AstTree` instances and every
`ast-*` testid on it is duplicated. Two e2e specs that had been fine failed
with `strict mode violation: getByTestId('ast-search') resolved to 2 elements`
the first time `/ast` was run after it.

The fix is the scoping, not a rename: `page.getByTestId('chat').getByTestId(...)`,
because the panel is a **sibling** of `[data-testid="chat"]`, not a descendant.
Two instances is the design — the tree components hold no Redux precisely so
they can be used in both places — so a testid that names one of them has to say
which. Note this one is invisible to the unit suite: `querySelector` returns
the first match, and Playwright's strict mode is a different tool being strict.

## Things about the chat package itself

Kept apart from the bundle story above, because none of them is about a browser — they are what a
change in `packages/chat` needs to know on the first day.

- **A spec that touches Redux needs a `<Provider>`, and `test/store.ts` is the way to get one.**
  `makeStore(overrides?, options?)` returns `{store, actions}`; import it as `#test/store` rather
  than hand-rolling `configureStore`. Everything else — `App`, `Chat`, `Input`, `ConsolePanel` —
  reads the store, so this is most of the components, not an edge case.
- **The TUI tree has no Redux dependency at all** (`src/components/*` takes `FlatNode[]` and
  `source` as props), so its six specs mount with no Provider. That is the property that lets the
  same `AstTree` render inside a chat message and inside the console panel, and it is worth
  keeping: a component that reached for the store could not be used in both.
- **`npm run build` at the root runs client then chat, sequentially, and the order is the
  contract.** The client stages into `out-build` and then `rimraf`s and swaps `out/` wholesale;
  chat writes `out/chat/` beside the editor's files and deletes nothing. In parallel it is a
  race on one directory. The root `.madrun.ts` names both paths absolutely, because they are
  chained with `&&` and a relative `cd` resolves from inside the previous directory.
- **The page is `out/chat/index.html`, and the URL is `/chat`.** The chunks go to `out/chat/`,
  so a page *beside* that directory as `chat.html` loses the name: `/chat` resolves to the
  directory, and a directory with no `index.html` is a **302 to a file listing**, not the app.
  Inside the directory, both `/chat` and `/chat/` serve the page. The stylesheet has to move
  with it — a `href` into the parent directory is one more relative path to break, and it is
  the kind of break no build reports.
- **A 200 tells you nothing about *which* page you got.** `/chat.html` answered 200 with the
  **editor's** `index.html`, because `ServeStaticModule`'s default fallback is
  `app.get('{*any}')` — every unmatched GET is a `sendFile` of the root `index.html`. So the
  check that finds it is a **nonsense path**: a real chunk returns `text/javascript`, a missing
  one returned the page. `curl /nope-xyz.js` and read the *content type*, not the status.
- **`nanoid` is not a dependency.** RTK re-exports it: `import {nanoid} from '@reduxjs/toolkit'`.
- **`getComputedStyle` is `''` on a detached element, and `parseInt('')` is `NaN`.**
  `growTo` reads the cap off `getComputedStyle(box).maxHeight` and compares it to
  `scrollHeight`, so a spec that builds its box with `document.createElement` and
  never appends it gets `NaN > NaN`, the comparison is always false, and the
  "taller than the cap" branch is **unreachable** — which the 100% gate reports
  as a missing branch rather than as a wrong assertion. The spec appends the
  element to `document.body` and removes it after. Measured, and it is the same
  trap as a detached-element measurement anywhere else: check the thing is in the
  state you are about to measure.
- **`Enter` is a newline and `Ctrl+Enter` sends.** Plain `Enter` reaches no
  branch in `Input`'s key handler on purpose — the browser inserts the newline
  and `onChange` picks it up. A spec that sends a line has to press the chord,
  or it is testing nothing: it will pass on the code before the change as well.
  The e2e is what actually settles the binding, because only it runs in a
  browser; a `fireEvent.keyDown` cannot produce a newline in jsdom.

**A new file in `packages/chat` is measured immediately.** `.nycrc.json` is `all: true` with
`checkCoverage`, so a file nothing imports is still counted and the gate goes red on it. The same
thing happened in `packages/client` when the build fix added `src/shims/empty.js`: a bundler-only
module, 0%, and the fix was a **spec beside it** — not another `exclude` entry, because
`docs/memory/coverage.md` is explicit that adding a path to `exclude` is a claim a file cannot be
covered. `src/shims/jest-validate.ts` beside it already had one, and that is the precedent.

## The lesson worth keeping

**A passing build is evidence about the build.** The page is a different program
from the bundle, and it only runs in a browser. The cheapest possible check is
three lines, and it found everything above:

```js
await page.goto('http://localhost:8080/chat/');
await page
    .getByRole('textbox')
    .fill('/source\nconst a = 1;');
await page.keyboard.press('Enter');
```

Two bugs in this work were found the same way and neither was in a bundle: `Enter`
completing a fully-typed command instead of sending it (the autocomplete still
showed one row), and the `↑` recall walking the wrong direction (`cursor`
clamped with `Math.max(at - 1, 0)` started at 0 and never moved). Both were
green in every unit test.

## Static imports bypass `chunks: 'async'` — and `enforce: true` is the override

`highlight.ts` imports `@lezer/javascript` and `@lezer/highlight` at the top level.
`SourceBlock` imports `highlight.ts`. `Message.tsx` imports `SourceBlock`.
`Chat.tsx` imports `Message.tsx`. `index.tsx` imports `Chat.tsx`. Every link is a
static `import`.

`chunks: 'async'` on a cacheGroup is a statement about *dynamically-imported*
modules: it splits what is reached through `import()`. A module that is statically
reachable from the entry is in the initial graph, and `chunks: 'async'` does not
move it. `enforce: true` is what overrides that — it makes the group
unconditional, ignoring `minSize`, `minChunks` and the import style, and the
runtime loads the chunk on first use instead of at page load.

**But `enforce: true` only defers what nothing needs synchronously.** Measured on
this package with a clean `out/chat` before and after adding the group:

- qword/`@codemirror` — deferred. It is reached only through
  `React.lazy(() => import('./CodeMirrorBox.tsx'))`, so nothing on the initial
  render needs it, and the group moved it into an async `codemirror-*.js`.
- chat's own `@lezer` — **not** deferred, and it was never in the chat chunk
  either. `SourceBlock` renders the seeded `/source` message on first paint, so
  `highlight.ts` — and the grammar it needs — is synchronously reachable.

So the plan's verify (`ls out/chat/codemirror-*.js` exists, and
`grep -c lezer out/chat/chat-*.js` prints 0) **passes while the stated goal does
not hold**: `@lezer` is still in the initial payload. Not through chat's code —
the initial 3.1 MB chunk carries a second copy of the grammar that arrives with
`@putout/editor-commands`' static pull on 🐊**Putout**'s parser tree, and no
cacheGroup in `packages/chat` can move that. The initial payload measured
3,436,261 bytes before the change and 3,436,344 after — the difference is the
chat chunk itself, and the 3.1 MB chunk's hash is unchanged.

**The rule: `chunks: 'async'` is for dynamically-imported modules, `enforce: true`
is for modules you want deferred regardless of import style — and neither can
defer a module the first render needs. Check the initial chunk set, not the chunk
you were aiming at.** The check that would have caught it is the one in
[`e2e.md`](./e2e.md)'s spirit: sum the `<script>`s in the built `index.html`
before and after, because a green `grep` over `chat-*.js` says nothing about
`257-*.js`.

## A lint message that names a line is a claim about that line

The same habit applies one level up. `flatlint`'s `add-missing-assign` reported
`9:49` on a `process.env.NODE_ENV` read in `packages/chat/rspack.config.js`, and
the client's copy of that line — byte-identical, same column — linted clean. Four
wrong hypotheses followed (the package directory, `eslint.config.js` vs `.ts`,
the word `test` in a comment, a binding named `test`), and the fifth was right:
a `: string` annotation on a *different line* made the file parse as TypeScript
and the rule started asking for an `env` assign.

Two things carry over. **Check the claim before believing the line** — a control
falsifies an attribution in one command. And **`--fix` on that rule changes
nothing and suppresses the report**, so CI (`redrun fix:lint`) never sees it: a
report that vanishes under `--fix` while the file stays broken deserves more
attention, not less. Measured in full in `~/broken-flatlint.md`.
